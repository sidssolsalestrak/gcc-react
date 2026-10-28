import React, { useState, useEffect } from 'react'
import Layout from '../../../layout'
import DataTable from '../../../utils/dataTable'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import {
    Box, Button, FormControl, Grid, IconButton, InputLabel, MenuItem, Select,
    TextField, Typography, Tooltip, ClickAwayListener
} from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from "../../../services/api";
import useToast from "../../../utils/useToast";
import DeleteIcon from "@mui/icons-material/Delete";
import { MdOutlineEdit } from 'react-icons/md';
import { ImDownload3 } from "react-icons/im";
import ConfirmationDialog from '../../../utils/confirmDialog';
import { getMasterPanel } from "../../../services/masterPanelService";
import usePageTitle from '../../../services/usePageTitle';

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }
const boxStyle = { border: 1, borderColor: "divider", borderRadius: "5px", minHeight: "20vh", p: 1 }
const headStyle = { color: "#1a1917", fontSize: "18.2px", fontWeight: 500 }
const menuStyle = { PaperProps: { style: { maxHeight: 200 } } }
const errStyle = { color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }
const tooltipSx = {
    tooltip: {
        sx: {
            backgroundColor: "#1e293b", color: "#ffffff", fontSize: "12px", fontWeight: 500,
            padding: "8px 12px", maxWidth: 320, lineHeight: 1.5,
        },
    },
    arrow: { sx: { color: "#1e293b" } },
};

const INITIAL_FORM_STATE = {
    name: "", address: "", email: "", phone: "", mobile: "",
    zone: "", region: "", area: "", territory: "",
};

// stk_tel is stored as 0 when empty
const showNum = (v) => (v && String(v) !== "0") ? String(v) : "";

const Stockist = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const showAlert = useToast();

    const [value, setValue] = useState('1');
    const [tableData, settableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accStat, setAccStat] = useState(null);
    const [masterPanel, setMasterPanel] = useState({});
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [original, setoriginal] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const [tooltipOpen, setTooltipOpen] = useState(false);

    // dropdown data
    const [zoneData, setzoneData] = useState([]);
    const [regionData, setregionData] = useState([]);
    const [areaData, setareaData] = useState([]);
    const [territoryData, setterritoryData] = useState([]);

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

    // labels derived from masterPanel with fallbacks
    const stkLabel = masterPanel["STKS"] || "Stockist";
    const zoneLabel = masterPanel["ZONE"] || "Zone";
    const regionLabel = masterPanel["REGN"] || "Region";
    const areaLabel = masterPanel["AREA"] || "Area";
    const territoryLabel = masterPanel["TERR"] || "Territory";
    usePageTitle(stkLabel);

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    /*---------- confirmation dialog ---------*/
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null, loading: false,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    });

    const showConfirmationDialog = (config) => {
        setConfirmationDialog({ ...confirmationDialog, ...config, open: true });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({ ...confirmationDialog, open: false });
    };

    const showSubmitConfirmation = () => {
        if (!validateForm()) {
            showAlert.error("please fill all the Mandatory Fields", "error");
            return;
        }
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} ${stkLabel}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete ${stkLabel}`,
            message: `Are you sure you want to delete this ${stkLabel} Record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteStockist(row),
        });
    };

    /*------------ handle form change ------------*/
    const handleChangeForm = (field, val) => {
        // numbers only (PHP: numbersonly)
        if (["phone", "mobile"].includes(field) && !/^[0-9]*$/.test(val)) return;

        setFormData((prev) => ({ ...prev, [field]: val }));

        if (errors[field] && String(val).trim() !== "") {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    // zone -> region -> area -> territory cascade (PHP: regionData / areaData / territoryData)
    const handleZoneChange = (val) => {
        setFormData((prev) => ({ ...prev, zone: val, region: "", area: "", territory: "" }));
        setErrors((prev) => ({ ...prev, zone: "" }));
    };
    const handleRegionChange = (val) => {
        setFormData((prev) => ({ ...prev, region: val, area: "", territory: "" }));
        setErrors((prev) => ({ ...prev, region: "" }));
    };
    const handleAreaChange = (val) => {
        setFormData((prev) => ({ ...prev, area: val, territory: "" }));
        setErrors((prev) => ({ ...prev, area: "" }));
    };

    /*------------ form validation ------------*/
    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.name || formData.name.trim() === "") newErrors.name = `The ${stkLabel} Name field is required.`;

        if (!formData.email || formData.email.trim() === "") newErrors.email = "The Email field is required.";
        else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format";

        if (!formData.mobile) newErrors.mobile = "The Mobile No field is required.";
        else if (formData.mobile.length !== 10) newErrors.mobile = "Enter a valid 10-digit mobile number";

        if (!formData.zone) newErrors.zone = `The ${zoneLabel} field is required.`;
        if (!formData.region) newErrors.region = `The ${regionLabel} field is required.`;
        if (!formData.area) newErrors.area = `The ${areaLabel} field is required.`;
        if (!formData.territory) newErrors.territory = `The ${territoryLabel} field is required.`;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /*------------ payload ------------*/
    const buildPayload = () => ({
        stk_name: (formData.name || "").trim(),
        stk_add: (formData.address || "").trim(),
        stk_email: (formData.email || "").trim(),
        stk_tel: (formData.phone || "").toString().trim(),
        stk_mob: (formData.mobile || "").toString().trim(),
        zone_id: formData.zone,
        reg_id: formData.region,
        area_id: formData.area,
        ter_id: formData.territory,
    });

    /*------------ form submit ------------*/
    const onSubmit = async () => {
        try {
            const res = await axios.post("/create_stockist", buildPayload());
            if (res?.data?.success) {
                showAlert.success(`${stkLabel} added successfully`);
                setFormData(INITIAL_FORM_STATE);
                setErrors({});
                fetchTableData();
            } else {
                showAlert.error(res?.data?.message);
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                showAlert.error(error?.response?.data?.message || "Validation failed");
            } else {
                console.error(error);
                showAlert.error("Failed to add");
            }
        } finally {
            closeConfirmationDialog();
        }
    };

    /*------------ form edit submit ------------*/
    const onEdit = async () => {
        try {
            const payload = { ...buildPayload(), id: String(decodedId), hdnData: original.name };
            const res = await axios.post("/update_stockist", payload);
            if (res?.data?.success) {
                showAlert.success(`${stkLabel} Updated successfully`);
                setFormData(INITIAL_FORM_STATE);
                setValue('1');
                navigate(`/masters/stockist`);
            } else {
                showAlert.error(res?.data?.message);
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                showAlert.error(error?.response?.data?.message || "Validation failed");
            } else {
                console.error(error);
                showAlert.error("Failed to Update");
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    };

    /*---------- delete ---------*/
    const deleteStockist = async (row) => {
        const rowId = row?.row?.id;
        try {
            const res = await axios.post(`/delete_stockist/${rowId}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${stkLabel} Record`);
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error(error?.response?.data?.message || "failed to delete");
        } finally {
            closeConfirmationDialog();
        }
    };

    const editdata = (row) => {
        const encodeId = row?.row?.id;
        setErrors({});
        navigate(`/masters/stockist/${btoa(encodeId)}`);
    };

    /*----------table columns---------*/
    const columns = [
        { field: "index", headerName: "#", filterable: true, sortable: true },
        { field: "stk_name", headerName: "Name", filterable: true, sortable: true },
        { field: "stk_email", headerName: "Email", filterable: true, sortable: true },
        { field: "stk_mob", headerName: "Mobile", filterable: true, sortable: true },
        { field: "zone_name", headerName: zoneLabel, filterable: true, sortable: true },
        { field: "reg_name", headerName: regionLabel, filterable: true, sortable: true },
        { field: "area_name", headerName: areaLabel, filterable: true, sortable: true },
        {
            field: "",
            headerName: "Action",
            filterable: true,
            sortable: true,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) && (
                        <IconButton className='updateBtn' size="small" onClick={() => editdata(row)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>
                    )}
                    {[0, 2].includes(Number(accStat)) && (
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row)}>
                            <DeleteIcon size={15} />
                        </IconButton>
                    )}
                </>
            )
        },
    ];

    /*---------- fetch table data ---------*/
    const applyAccStat = (stat) => {
        if (stat !== null && stat !== undefined) {
            setAccStat(String(stat));
            localStorage.setItem("acc_stat", stat);
        }
    };

    const fetchTableData = async () => {
        try {
            setLoading(true);
            const res = await axios.post("/getStockistList");
            const data = Array.isArray(res?.data?.data) ? res.data.data.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            settableData(data);
            applyAccStat(res?.data?.acc_stat);
        } catch (error) {
            console.error(error);
            settableData([]);
            // empty list comes back as 404 but still carries acc_stat
            applyAccStat(error?.response?.data?.acc_stat);
        } finally {
            setLoading(false);
        }
    };

    /*---------- dropdown fetches ---------*/
    const fetchZone = async () => {
        try {
            const res = await axios.post("/getReportsZone");
            setzoneData(Array.isArray(res?.data?.data) ? res.data.data : []);
        } catch (error) {
            console.error(error);
            setzoneData([]);
        }
    };

    const fetchRegion = async (zone) => {
        try {
            const res = await axios.post("/extractRegionList", { zone_id: zone });
            setregionData(Array.isArray(res?.data?.data) ? res.data.data : []);
        } catch (error) {
            console.error(error);
            setregionData([]);
        }
    };

    const fetchArea = async (region, zone) => {
        try {
            const res = await axios.post("/AreaAm", { reg_id: region, zone_id: zone });
            setareaData(Array.isArray(res?.data?.data) ? res.data.data : []);
        } catch (error) {
            console.error(error);
            setareaData([]);
        }
    };

    const fetchTerritory = async (area) => {
        try {
            const res = await axios.post("/getStockistTerritory", { area_id: area });
            setterritoryData(Array.isArray(res?.data?.data) ? res.data.data : []);
        } catch (error) {
            console.error(error);
            setterritoryData([]);
        }
    };

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/edit_Stockist", { id: decodedId });
            const data = res?.data?.data?.[0];
            if (data) {
                const editData = {
                    name: data.stk_name || "",
                    address: data.stk_add || "",
                    email: data.stk_email || "",
                    phone: showNum(data.stk_tel),
                    mobile: showNum(data.stk_mob),
                    zone: data.zone_id || "",
                    region: data.reg_id || "",
                    area: data.area_id || "",
                    territory: data.ter_id || "",
                };
                setFormData(editData);
                setoriginal(editData);
            }
        } catch (error) {
            console.error(error);
            showAlert.error("Failed to edit");
        }
    };

    /*---------- initial render ---------*/
    useEffect(() => {
        fetchTableData();
        fetchZone();
    }, []);

    /*---------- cascading dropdown effects ---------*/
    useEffect(() => {
        if (Number(formData.zone) > 0) fetchRegion(formData.zone);
        else setregionData([]);
    }, [formData.zone]);

    useEffect(() => {
        if (Number(formData.region) > 0 && Number(formData.zone) > 0) fetchArea(formData.region, formData.zone);
        else setareaData([]);
    }, [formData.region]);

    useEffect(() => {
        if (Number(formData.area) > 0) fetchTerritory(formData.area);
        else setterritoryData([]);
    }, [formData.area]);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData(INITIAL_FORM_STATE);
            setoriginal(INITIAL_FORM_STATE);
            setErrors({});
            return;
        }
        setValue('1');
        getEditData(decodedId);
        setErrors({});
    }, [decodedId]);

    /*---------- update button enabled only when something changed ---------*/
    const isEdited = Object.keys(INITIAL_FORM_STATE).some(
        (key) => String(formData[key] ?? "").trim() !== String(original[key] ?? "").trim()
    );

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: stkLabel },
        ]}>
            <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                <Box>
                    <h1 className="mainTitle">{stkLabel}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={(e, v) => setValue(v)} aria-label="stockist tabs">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {stkLabel}</Typography>
                        }

                        {/*---------------- Add / Edit section--------------- */}
                        <TabPanel value="1">
                            <Grid container spacing={2}>
                                {/* left block: Stockist Details */}
                                <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                                    <Box sx={boxStyle}>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, margin: 1, p: 1 }}>
                                            <Typography sx={headStyle}>{stkLabel} Details</Typography>

                                            <ClickAwayListener onClickAway={() => setTooltipOpen(false)}>
                                                <div>
                                                    <Tooltip
                                                        arrow open={tooltipOpen} onClose={() => setTooltipOpen(false)}
                                                        disableFocusListener disableHoverListener disableTouchListener
                                                        title="Special Characters Not Allowed" slotProps={tooltipSx}
                                                    >
                                                        <TextField
                                                            value={formData.name} onClick={() => setTooltipOpen(true)}
                                                            onChange={(e) => {
                                                                const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                                                handleChangeForm("name", onlyText);
                                                            }}
                                                            required size='small' placeholder='Enter Name'
                                                            variant='outlined' label="Name" fullWidth
                                                            error={!!errors.name} helperText={errors.name}
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </ClickAwayListener>

                                            <TextField
                                                size="small" multiline rows={3} label="Address"
                                                value={formData.address}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                                    handleChangeForm("address", onlyText);
                                                }}
                                                placeholder='Enter Address'
                                            />

                                            <TextField
                                                value={formData.email}
                                                onChange={(e) => handleChangeForm("email", e.target.value.replace(/\s+/g, ""))}
                                                onBlur={(e) => {
                                                    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
                                                    if (e.target.value && !ok) setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
                                                }}
                                                error={!!errors.email} helperText={errors.email}
                                                required size='small' placeholder='Enter Email'
                                                variant='outlined' label="Email" fullWidth
                                            />

                                            <TextField
                                                value={formData.phone}
                                                onChange={(e) => handleChangeForm("phone", e.target.value)}
                                                size='small' placeholder='Enter Phone'
                                                variant='outlined' label="Phone" fullWidth
                                            />

                                            <TextField
                                                value={formData.mobile}
                                                onChange={(e) => handleChangeForm("mobile", e.target.value)}
                                                onBlur={(e) => {
                                                    if (e.target.value && e.target.value.length !== 10)
                                                        setErrors((prev) => ({ ...prev, mobile: "Enter a valid 10-digit mobile number" }));
                                                }}
                                                required size='small' placeholder='Enter Mobile No'
                                                variant='outlined' label="Mobile" fullWidth
                                                error={!!errors.mobile} helperText={errors.mobile}
                                            />
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* right block: Other Details */}
                                <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                                    <Box sx={boxStyle}>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, margin: 1, p: 1 }}>
                                            <Typography sx={headStyle}>Other Details</Typography>

                                            <FormControl fullWidth size="small" required>
                                                <InputLabel id="zone">{zoneLabel}</InputLabel>
                                                <Select value={formData.zone} id='zone' label={zoneLabel} labelId="zone"
                                                    variant="outlined" error={!!errors.zone} MenuProps={menuStyle}
                                                    onChange={(e) => handleZoneChange(e.target.value)}>
                                                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                                                    {zoneData?.map((val) => (
                                                        <MenuItem key={val.id} value={val.id}>{val?.zone_name}</MenuItem>
                                                    ))}
                                                </Select>
                                                {errors?.zone && <span style={errStyle}>{errors.zone}</span>}
                                            </FormControl>

                                            <FormControl fullWidth size="small" required>
                                                <InputLabel id="region">{regionLabel}</InputLabel>
                                                <Select value={formData.region} id='region' label={regionLabel} labelId="region"
                                                    variant="outlined" error={!!errors.region} MenuProps={menuStyle}
                                                    onChange={(e) => handleRegionChange(e.target.value)}>
                                                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                                                    {regionData?.map((val) => (
                                                        <MenuItem key={val.id} value={val.id}>{val?.reg_name}</MenuItem>
                                                    ))}
                                                </Select>
                                                {errors?.region && <span style={errStyle}>{errors.region}</span>}
                                            </FormControl>

                                            <FormControl fullWidth size="small" required>
                                                <InputLabel id="area">{areaLabel}</InputLabel>
                                                <Select value={formData.area} id='area' label={areaLabel} labelId="area"
                                                    variant="outlined" error={!!errors.area} MenuProps={menuStyle}
                                                    onChange={(e) => handleAreaChange(e.target.value)}>
                                                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                                                    {areaData?.map((val) => (
                                                        <MenuItem key={val.id} value={val.id}>{val?.area_name}</MenuItem>
                                                    ))}
                                                </Select>
                                                {errors?.area && <span style={errStyle}>{errors.area}</span>}
                                            </FormControl>

                                            <FormControl fullWidth size="small" required>
                                                <InputLabel id="territory">{territoryLabel}</InputLabel>
                                                <Select value={formData.territory} id='territory' label={territoryLabel} labelId="territory"
                                                    variant="outlined" error={!!errors.territory} MenuProps={menuStyle}
                                                    onChange={(e) => handleChangeForm("territory", e.target.value)}>
                                                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                                                    {territoryData?.map((val) => (
                                                        <MenuItem key={val.id} value={val.id}>{val?.ter_name}</MenuItem>
                                                    ))}
                                                </Select>
                                                {errors?.territory && <span style={errStyle}>{errors.territory}</span>}
                                            </FormControl>
                                        </Box>
                                    </Box>

                                    {/* submit */}
                                    <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, mt: 3 }}>
                                        {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                            <Button
                                                onClick={() => showSubmitConfirmation()}
                                                sx={{ mt: 2 }} color="primary" variant='contained'>
                                                Submit
                                            </Button>
                                        )}
                                        {(decodedId && [0, 2].includes(Number(accStat))) && (
                                            <Button
                                                onClick={() => showSubmitConfirmation()}
                                                sx={{ mt: 2 }} color="primary" variant='contained'
                                                disabled={!isEdited}>
                                                Update
                                            </Button>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/*---------------- View section--------------- */}
                        <TabPanel value="2" sx={{ padding: 0 }}>
                            <DataTable columns={columns} data={tableData} loading={loading} />
                        </TabPanel>
                    </TabContext>
                </Box>
            </Box>
            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={confirmationDialog.loading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout>
    )
}

export default Stockist