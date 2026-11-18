import React, { useCallback, useState } from 'react'
import Layout from '../../../layout'
import DataTable from '../../../utils/dataTable'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from "../../../services/api";
import { useEffect } from 'react';
import useToast from "../../../utils/useToast";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddStockist from './AddStockist';
import ConfirmationDialog from '../../../utils/confirmDialog';
import { MdOutlineEdit } from 'react-icons/md';
import { getMasterPanel } from "../../../services/masterPanelService";
import { Download } from '../../../utils/downloadExcel/Download';
import CircularProgressLoading from '../../../utils/CircularProgressLoading';
import usePageTitle from '../../../services/usePageTitle';

const style = {
    color: "#1a1917",
    fontSize: "18.2px",
    fontWeight: 500,
    mb: 1.5
}

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const Stockist = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [showTable, setshowTable] = useState(false)
    const [zoneData, setzoneData] = useState([]);
    const [region, setregion] = useState([]);
    const [area, setarea] = useState([]);
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(false)
    const [formData, setFormdata] = useState({
        zone: "0",
        region: "0",
        area: "0",
        status: "1"
    })
    const [progress, setProgress] = useState(null);
    const [formError, setFormError] = useState(false);
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);
    const [errors, setErrors] = useState({});

    // labels derived from masterPanel with fallbacks
    const zoneLabel = masterPanel["ZONE"] || "Zone";
    const stkLabel = masterPanel["STKS"] || "Stockist";
    const regionLabel = masterPanel["REGN"] || "Region";
    const areaLabel = masterPanel["AREA"] || "Area";
    const psmlabel = masterPanel["PSM"] || "PSM";
    usePageTitle(stkLabel)
    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        const resolveAccStat = async () => {
            try {
                const res = await axios.post("/getAccStat", {
                    menu_url: "masters/stockist",
                });

                const stat = res.data?.data?.acc_stat;
                if (stat !== null && stat !== undefined) {
                    localStorage.setItem("acc_stat", stat);
                    setAccStat(String(stat));
                }
            } catch (err) {
                console.log(err);
            }
        };

        resolveAccStat();
    }, []);

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

    /*---------- re usable toast ---------*/
    const showAlert = useToast();
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        loading: false,
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "primary"
    });

    const showConfirmationDialog = (config) => {
        setConfirmationDialog({
            ...confirmationDialog,
            ...config,
            open: true,
        });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({
            ...confirmationDialog,
            open: false,
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete ${stkLabel}`,
            message: `Are you sure you want to delete this ${stkLabel} Record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    /*---------- delete cat ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            const res = await axios.post(`/delete_stockist/${id}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${stkLabel} Record`)
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*----------for tab change---------*/
    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
        setshowTable(false);
        settableData([])
        setFormdata({
            zone: "0",
            region: "0",
            area: "0",
            status: "1"
        })
    }, []);

    /*------ handleChangeForm ---- */
    const handleChangeForm = (name, val) => {
        setFormdata((prev) => ({
            ...prev,
            [name]: val
        }))
    }

    const editdata = (row, isReactivate = false) => {
        let encodeId = row?.row?.id
        setValue('1');
        const query = isReactivate ? '?reactivate=1' : ''
        navigate(`/masters/stockist/${btoa(encodeId)}${query}`)
    }

    /*----------table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "stk_type_name",
            headerName: "TYPE",
            filterable: true,
        },
        {
            field: "stk_code",
            headerName: "CODE",
            filterable: true,
        },
        {
            field: "stk_name",
            headerName: stkLabel.toUpperCase(),
            filterable: true,
        },
        {
            field: "reg_name",
            headerName: regionLabel.toUpperCase(),
            filterable: true,
        },
        {
            field: "area_name",
            headerName: areaLabel.toUpperCase(),
            filterable: true,
        },
        {
            field: "sr_name",
            headerName: psmlabel,
            filterable: true,
        },
        {
            field: "state_name",
            headerName: "STATE",
            filterable: true,
        },
        {
            field: "city_name",
            headerName: "CITY",
            filterable: true,
        },
        {
            field: "status",
            headerName: "STATUS",
            filterable: true,
        },
        {
            field: "",
            headerName: "ACTION",
            filterable: true,
            width: 100,
            renderCell: (row) => {
                const status = (row?.row?.status || "").toString().trim().toLowerCase();
                const isInactive = status === "in active" || status === "inactive";
                const role = Number(accStat);

                if (isInactive) {
                    if (role === 0) {
                        return (
                            <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => editdata(row, true)}
                                sx={{ fontSize: "11px", textTransform: "none", py: 0, px: 1 }}
                            >
                                Reactivate
                            </Button>
                        );
                    }
                    return null;
                }

                return (
                    <>
                        {[0, 2].includes(role) && (
                            <IconButton className='updateBtn' size="small" onClick={() => editdata(row)}>
                                <MdOutlineEdit size={15} />
                            </IconButton>
                        )}
                        {[0, 2].includes(role) && (
                            <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row)}>
                                <DeleteIcon size={15} />
                            </IconButton>
                        )}
                    </>
                );
            }
        },
    ]

    const resetFields = (fields) => {
        fields.forEach((field) => handleChangeForm(field, field === "user" ? [] : "0"));
    };

    /*------------ get zone data ---------- */
    const fetchZone = async () => {
        try {
            const res = await axios.post("/getReportsZone");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setzoneData(data);
        } catch (error) {
            console.error(error);
            setzoneData([])
        }
    }

    /*----------fetch regions---------*/
    const fetchRegions = async (zone) => {
        try {
            const res = await axios.post("/extractRegionList", { zone_id: zone });
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setregion(data)
        } catch (error) {
            console.error(error);
            setregion([])
        }
    }

    /*----------fetch area---------*/
    const fetchArea = async (region) => {
        try {
            let payload = {
                reg_id: region,
                zone_id: null
            }
            const res = await axios.post("/AreaAm", payload);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setarea(data);
        } catch (error) {
            console.error(error);
            setarea([])
        }
    }

    /*----------fetch table data---------*/
    const fetchTableData = async () => {
        try {
            const missing = [];
            if (!formData.zone || formData.zone === "0") missing.push(zoneLabel);
            if (!formData.region || formData.region <= "0") missing.push(regionLabel);

            if (missing.length > 0) {
                showAlert.error(`Please select ${missing.join(" and ")}!`);
                setErrors((prev) => ({
                    ...prev,
                    zone: !formData.zone || formData.zone === "0" ? `${zoneLabel} is required` : "",
                    region: !formData.region || formData.region <= "0" ? `${regionLabel} is required` : ""
                }));
                return;
            }
            setErrors((prev) => ({ ...prev, zone: "", region: "" }));
            setLoading(true);
            setshowTable(true);
            let payload = {
                reg_id: formData.region,
                area_id: formData.area,
                status: formData.status
            }
            const res = await axios.post("/getStockistList", payload);
            //console.log("table res:", res?.data?.data);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data.map((row, index) => ({
                ...row,
                index: index + 1
            })) : []
            settableData(data)
        } catch (error) {
            console.error(error);
            settableData([])
        } finally {
            setLoading(false)
        }
    }

    /*----------initial render---------*/
    useEffect(() => {
        fetchZone();
    }, [])

    /*----------fetch region based on zone---------*/
    useEffect(() => {
        if (formData.zone) {
            let zone = formData.zone;
            fetchRegions(zone);
        }
    }, [formData.zone])

    /*----------fetch area based on region---------*/
    useEffect(() => {
        if (formData.region) {
            let region = formData.region;
            fetchArea(region);
        }
    }, [formData.region])

    /*---------- handle excel download ---------*/
    const download = async () => {
        const exportColumns = columns.filter((col) => col.headerName !== "ACTION");
        Download(
            tableData,
            exportColumns,
            "StockistMaster",
            setProgress,
            showAlert,
            "StockistMaster"
        )
    }

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: stkLabel },
        ]}>
            <Box sx={{ backgroundColor: 'white', m: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' } }}>
                <TabContext value={value}>
                    {!decodedId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList onChange={handleChange} aria-label="lab API tabs example">
                                <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                            </TabList>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {stkLabel}</Typography>
                    }
                    {/*---------------- Add section--------------- */}
                    <TabPanel value="1">
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <AddStockist />
                        </Box>
                    </TabPanel>
                    {/*---------------- View section--------------- */}
                    <TabPanel value="2" sx={{ padding: "10px 20px" }}>
                        <Typography sx={style}>{stkLabel} Records</Typography>
                        <Box sx={{ display: "flex", alignContent: "flex-start", gap: 1, flexWrap: "wrap", mb: 2 }}>
                            <FormControl sx={{ width: "200px" }} size="small" required>
                                <InputLabel id="zone">{zoneLabel}</InputLabel>
                                <Select value={formData.zone} id='zone' label={zoneLabel} error={!!errors.zone}
                                    labelId="zone" variant="outlined"
                                    onChange={(e) => {
                                        handleChangeForm("zone", e.target.value);
                                        resetFields(["region", "area"]);
                                        setregion([]);
                                        setarea([]);
                                        if (errors.zone) setErrors((prev) => ({ ...prev, zone: "" }));
                                    }}>
                                    <MenuItem style={{ fontSize: "11px" }} value="0">Select</MenuItem>
                                    {zoneData?.map((val) => (
                                        <MenuItem key={val.id} value={val.id}>{val?.zone_name}</MenuItem>
                                    ))}
                                </Select>
                                {errors?.zone && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.zone}</span>}
                            </FormControl>
                            <FormControl sx={{ width: "200px" }} size="small" required>
                                <InputLabel id="region">{regionLabel}</InputLabel>
                                <Select value={formData.region} id='region'
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                    label={regionLabel} error={!!errors.region}
                                    labelId="region" variant="outlined"
                                    onChange={(e) => {
                                        handleChangeForm("region", e.target.value);
                                        handleChangeForm("area", "0");
                                        if (errors.region) setErrors((prev) => ({ ...prev, region: "" }));
                                    }}>
                                    <MenuItem style={{ fontSize: "11px" }} value="0">Select</MenuItem>
                                    {region?.map((item, index) => (
                                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.reg_name}</MenuItem>
                                    ))}
                                </Select>
                                {errors?.region && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.region}</span>}
                            </FormControl>
                            <FormControl sx={{ width: "200px" }} size="small" >
                                <InputLabel id="area">{areaLabel}</InputLabel>
                                <Select value={formData.area} id='area' label={areaLabel}
                                    labelId="area" variant="outlined"
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                    onChange={(e) => handleChangeForm("area", e.target.value)}>
                                    <MenuItem style={{ fontSize: "11px" }} value="0">Select</MenuItem>
                                    {area?.map((item, index) => (
                                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.area_name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ width: "200px" }} size="small" >
                                <InputLabel id="status">Status</InputLabel>
                                <Select value={formData.status} id='status' label="Status"
                                    labelId="status" variant="outlined" onChange={(e) => handleChangeForm("status", e.target.value)}>
                                    <MenuItem style={{ fontSize: "11px" }} value="3">All</MenuItem>
                                    <MenuItem style={{ fontSize: "11px" }} value="1">Active</MenuItem>
                                    <MenuItem style={{ fontSize: "11px" }} value="2">In Active</MenuItem>
                                </Select>
                            </FormControl>
                            <Button onClick={() => fetchTableData()} variant='contained' color="primary" sx={{ alignSelf: "flex-start" }}>Search</Button>
                            {progress ? <CircularProgressLoading progress={progress} /> : <Button onClick={download} variant='contained' color="warning" sx={{ alignSelf: "flex-start" }}>Excel</Button>}
                        </Box>
                        {showTable &&
                            <DataTable
                                columns={columns}
                                data={tableData}
                                loading={loading}
                            />}

                    </TabPanel>
                </TabContext>
            </Box>
            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={loading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout >
    )
}

export default Stockist