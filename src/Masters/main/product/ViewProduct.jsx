import React, { useEffect, useState } from 'react'
import Layout from '../../../layout'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Button, Typography, TextField, FormControl, InputLabel, MenuItem, Select, IconButton } from '@mui/material'
import DataTable from '../../../utils/dataTable';
import useToast from "../../../utils/useToast";
import axios from "../../../services/api";
import { MdOutlineEdit } from 'react-icons/md';
import DeleteIcon from "@mui/icons-material/Delete";
import fetchSubCat from "./fetchSubCat";
import ConfirmationDialog from "../../../utils/confirmDialog";
import { Download } from "../../../utils/downloadExcel/Download";
import CircularProgress from '../../../utils/CircularProgressLoading';
import { getMasterPanel } from "../../../services/masterPanelService";
import FormatCurrency from "../../../utils/formatCurrency";
import usePageTitle from '../../../services/usePageTitle'

const renderCellStyle = { width: "100%", display: "flex", justifyContent: "center" }

const menuStyle = {
    PaperProps: {
        style: {
            maxHeight: 200
        }
    }
}

const headContainer = {
    backgroundColor: 'white', display: "flex", flexDirection: 'column', gap: 2,
    m: 2, p: 2, borderRadius: '6px',
    minHeight: '20vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' }
}

const style = {
    color: "#026CB6",
    fontSize: "21px",
    fontWeight: 500
}

const safeAtob = (str) => {
    if (!str) return "";
    try {
        return atob(str);
    } catch (error) {
        console.warn("Invalid Base64 string:", str);
        return "";
    }
};

const ViewProduct = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([]);
    const [subCat, setSubCat] = useState([]);
    const [loading, setloading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [formData, setFormdata] = useState({
        productName: "",
        subCatName: "",
        status: "1"
    })
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);

    // labels derived from masterPanel with fallbacks
    const prodLabel = masterPanel["PROD"] || "Product";
    const subCatLabel = masterPanel["PSUB"] || "Sub Category";
    const stkLabel = masterPanel["STKS"] || "Stockist";
    usePageTitle(`${prodLabel} View`)

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
                      menu_url: "masters/prod_mas",
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

    /*---------- decode values  ---------*/
    const decodedProductName = safeAtob(searchParams.get('product'));
    const decodedSubCategory = safeAtob(searchParams.get('subcat'));
    const decodedStatus = safeAtob(searchParams.get('status'));

    /*---------- handleChange  ---------*/
    const handleChange = (name, val) => {
        setFormdata((prev) => ({
            ...prev, [name]: val
        }))
    }

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
            loading: false
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete ${prodLabel}`,
            message: `Are you sure you want to delete this ${prodLabel}?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    const showReactivateConfirmation = (row) => {
        showConfirmationDialog({
            title: `Reactivate ${prodLabel}`,
            message: `Are you sure you want to reactivate this ${prodLabel}?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => reactivateProduct(row),
        });
    };

    const reactivateProduct = async (row) => {
        let id = row?.row?.prodid
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/prod_reactivate/${id}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Reactivated ${prodLabel}`)
                fetchData({ name: decodedProductName, cat: decodedSubCategory, status: decodedStatus });
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to reactivate")
        } finally {
            closeConfirmationDialog();
        }
    }

    /* ---------- edit product ---------- */
    const editdata = (row) => {
        let encodeId = row?.row?.prodid
        navigate(`/masters/prod_mas/${btoa(encodeId)}`)
    }

    /* ---------- ADD product ---------- */
    const addClick = () => {
        navigate('/masters/prod_mas')
    }

    /* ---------- table columns ---------- */
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "prodid",
            headerName: "ID",
            filterable: true,
        },
        {
            field: "sub_name",
            headerName: `${subCatLabel} Name`,
            filterable: true,
        },
        {
            field: "code",
            headerName: "Code",
            filterable: true,
        },
        {
            field: "prod_type",
            headerName: `${prodLabel} Type`,
            filterable: true,
        },
        {
            field: "prod_name",
            headerName: `${prodLabel} Name`,
            filterable: true,
        },
        {
            field: "fac_price",
            headerName: "Ex Factory (ASP)",
            filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "wd_price",
            headerName: `${stkLabel} Price (PTS)`,
            filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "stk_price",
            headerName: "Retail Price (PTR)",
            filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "mrp_price",
            headerName: "MRP",
            filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "prod_stat",
            headerName: "STATUS",
            filterable: true,
        },
        {
            field: "",
            headerName: "Action",
            filterable: true,
            width: 100,
            renderCell: (row) => {
                const status = (row?.row?.prod_stat || "").toString().trim().toLowerCase();
                const isInactive = status === "in active" || status === "inactive";

                if (isInactive) {
                    if (Number(accStat) === 0) {
                        return (
                            <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => showReactivateConfirmation(row)}
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
                );
            }
        },
    ]

    const excelColumns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "prodid",
            headerName: "ID",
            filterable: true,
        },
        {
            field: "sub_name",
            headerName: `${subCatLabel} Name`,
            filterable: true,
        },
        {
            field: "code",
            headerName: "Code",
            filterable: true,
        },
        {
            field: "prod_type",
            headerName: `${prodLabel} Type`,
            filterable: true,
        },
        {
            field: "prod_name",
            headerName: `${prodLabel} Name`,
            filterable: true,
        },
        {
            field: "fac_price",
            headerName: "Ex Factory (ASP)",
            filterable: true,
        },
        {
            field: "wd_price",
            headerName: `${stkLabel} Price (PTS)`,
            filterable: true,
        },
        {
            field: "stk_price",
            headerName: "Retail Price (PTR)",
            filterable: true,
        },
        {
            field: "mrp_price",
            headerName: "MRP",
            filterable: true,
        },
        {
            field: "prod_stat",
            headerName: "STATUS",
            filterable: true,
        },
    ]

    /* ---------- table data & sub cat data---------- */
    const fetchData = async ({ name, cat, status }) => {
        try {
            setloading(true)
            //fetch sub data
            await fetchSubCat(setSubCat)

            //table data fetch
            try {
                let payload = {
                    pd_name: name ? name.trim() : "",
                    subcatname: cat || "",
                    status: status
                }
                const res = await axios.post("/prodview", payload);
                const data = Array.isArray(res?.data?.data) ? res?.data?.data.map((row, index) => ({
                    ...row,
                    index: index + 1,
                    prod_type: row.prod_type == 0 ? "Existing" : "New Launch"
                })) : []
                settableData(data)
            } catch (error) {
                if (error?.response?.status === 400) {
                    showAlert.error("No Records Found For Given Parameters")
                    settableData([])
                }
                console.error("table data fetch error", error);
                settableData([])
            }
        } catch (error) {
            console.error(error);
            showAlert.error(error)
        } finally {
            setloading(false)
        }
    }

    /* ---------------- SYNC STATE FROM URL ---------------- */
    useEffect(() => {
        setFormdata({
            productName: decodedProductName || "",
            subCatName: decodedSubCategory || "",
            status: decodedStatus || "1"
        })
    }, [decodedProductName, decodedSubCategory, decodedStatus])

    /* ---------- initial render ---------- */
    useEffect(() => {
        fetchData({ name: decodedProductName, cat: decodedSubCategory, status: decodedStatus });
    }, [decodedProductName, decodedSubCategory, decodedStatus])

    /* ---------- on search ---------- */
    const onSearch = () => {
        const params = new URLSearchParams();
        const trimmedProductName = formData.productName.trim();
        if (trimmedProductName) params.append('product', btoa(trimmedProductName));
        if (formData.subCatName) params.append('subcat', btoa(formData.subCatName));
        if (formData.status) params.append('status', btoa(formData.status));
        navigate(`/masters/prodview?${params.toString()}`);
    }

    /*---------- delete Product ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.prodid
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/prod_delete/${id}`);
            //console.log("delete res:", res);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${prodLabel}`)
                fetchData({ name: decodedProductName, cat: decodedSubCategory, status: decodedStatus });
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- handle excel download ---------*/
    const download = async () => {
        Download(
            tableData,
            excelColumns,
            "ProductMaster",
            setProgress,
            showAlert,
            "ProductMaster"
        )
    }

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: `${prodLabel} View` },
        ]}>
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    {/* <Typography sx={style}>Product View</Typography> */}
                    <Box>
                        <h1 className="mainTitle">{prodLabel} View</h1>
                    </Box>
                    <Button onClick={addClick} sx={{ height: "30px" }} variant="contained" color="primary">Add New {prodLabel}</Button>
                </Box>
                <Box sx={{ display: "flex", alignContent: "center", gap: 2, flexWrap: "wrap" }}>
                    <TextField value={formData.productName} sx={{ width: "200px" }} size='small' variant='outlined'
                        label={`${prodLabel} Name`} placeholder={`Enter ${prodLabel} Name`} onChange={(e) => {
                            const onlyText = e.target.value.replace(/^\s+/, "");
                            handleChange("productName", onlyText)
                        }} />
                    <FormControl sx={{ width: "200px" }} size="small" >
                        <InputLabel id="SubCategoryName">{subCatLabel} Name</InputLabel>
                        <Select value={formData.subCatName} id='SubCategoryName' label={`${subCatLabel} Name`} MenuProps={menuStyle}
                            labelId="SubCategoryName" variant="outlined" onChange={(e) => handleChange("subCatName", e.target.value)}>
                            <MenuItem style={{ fontSize: "11px" }} value="">Select {subCatLabel}</MenuItem>
                            {subCat?.map((item, index) => (
                                <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.sub_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ width: "200px" }} size="small" >
                        <InputLabel id="status">Status</InputLabel>
                        <Select value={formData.status} id='status' label="Status"
                            labelId="status" variant="outlined" onChange={(e) => handleChange("status", e.target.value)}>
                            <MenuItem style={{ fontSize: "11px" }} value="3">All</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="1">Active</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="2">In Active</MenuItem>
                        </Select>
                    </FormControl>
                    <Button onClick={onSearch} variant='contained' color="primary">Search</Button>
                    {progress ? <CircularProgress progress={progress} /> : <Button onClick={download} variant='contained' color="warning">Excel</Button>}
                </Box>
            </Box>
            {/* table */}
            <Box sx={headContainer}>
                <DataTable data={tableData} columns={columns} loading={loading} />
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

export default ViewProduct