import React, { useState, useEffect } from 'react'
import Layout from '../../../layout'
import {
    Box, TextField, Button, FormControl, InputLabel, Select, MenuItem,
    IconButton, Typography, RadioGroup, FormControlLabel, Radio, FormLabel
} from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import axios from "../../../services/api";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useToast from "../../../utils/useToast";
import ConfirmationDialog from "../../../utils/confirmDialog";
import { MdOutlineEdit } from "react-icons/md";
import usePageTitle from '../../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }
const menuStyle = { PaperProps: { style: { maxHeight: 200 } } }

const emptyForm = {
    brand: "",
    relateTo: "0",   // 0 = Product, 1 = General
    type: "",
    description: "",
}
const emptyValidation = { brand: "" }

const MarketingInput = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [brands, setBrands] = useState([])
    const [types, setTypes] = useState([])
    const [value, setValue] = useState('1');
    const [loading, setLoading] = useState(true)
    const [accStat, setAccStat] = useState(null);
    const [formData, setFormData] = useState(emptyForm)
    const [original, setoriginal] = useState(emptyForm)
    const [validation, setValidations] = useState(emptyValidation)

    const resetValidations = () => setValidations(emptyValidation)

    const decodedId = id ? atob(id) : null;
    usePageTitle("Marketing Input")

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
        setConfirmationDialog({ ...confirmationDialog, ...config, open: true });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({ ...confirmationDialog, open: false });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} Marketing Input`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Marketing Input`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteInput(row),
        });
    };

    /*---------- validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = { brand: "" }
        if (!formData.brand) {
            newValidations.brand = "The Brand field is required";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    const buildPayload = () => ({
        subcat_id: formData.brand,
        relation_type: formData.relateTo,
        type: formData.type || 0,
        description: formData.description,
    })

    /*---------- add ---------*/
    const onSubmit = async () => {
        try {
            const res = await axios.post("/addMarketingInput", buildPayload())
            if (res?.data?.success) {
                showAlert.success("Marketing Input added successfully")
                setFormData(emptyForm);
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                showAlert.error(error?.response?.data?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to ADD Marketing Input")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- edit ---------*/
    const onEdit = async () => {
        try {
            const res = await axios.post("/updateMarketingInput", { id: decodedId, ...buildPayload() })
            if (res?.data?.success) {
                showAlert.success("Marketing Input Updated successfully")
                setFormData(emptyForm);
                setValue('1')
                navigate(`/masters/marketingInput`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                showAlert.error(error?.response?.data?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to Update Marketing Input")
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- delete ---------*/
    const deleteInput = async (row) => {
        const rowId = row?.row?.id
        try {
            const res = await axios.post(`/deleteMarketingInput/${rowId}`);
            if (res?.data?.success) {
                showAlert.success("Successfully Deleted Marketing Input")
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    const formDataChange = (field, val) => {
        setFormData((prev) => ({ ...prev, [field]: val }))
    }

    const handleChange = (event, newValue) => setValue(newValue);

    /*---------- table columns ---------*/
    const columns = [
        { field: "index", headerName: "#", filterable: true, sortable: true },
        {
            field: "relation_type",
            headerName: "Related To",
            filterable: true,
            sortable: true,
            renderCell: (row) => (Number(row?.row?.relation_type) === 0 ? "Product" : "General"),
        },
        { field: "market_samp_type", headerName: "Type", filterable: true, sortable: true },
        { field: "sub_name", headerName: "Brand", filterable: true, sortable: true },
        { field: "Description", headerName: "Description", filterable: true, sortable: true },
        {
            field: "",
            headerName: "Action",
            filterable: true,
            width:100,
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
    ]

    const editdata = (row) => {
        const encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/marketingInput/${btoa(encodeId)}`)
    }

    /*---------- fetch data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/marketingInputData");
            const data = Array.isArray(res?.data?.data) ? res.data.data.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            settableData(data);
            setAccStat(res?.data?.acc_stat ?? null);
            if (res?.data?.acc_stat !== null && res?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", res?.data?.acc_stat);
            }
        } catch (error) {
            console.error(error);
            settableData([]);
        } finally {
            setLoading(false)
        }
    }

    const fetchBrands = async () => {
        try {
            const res = await axios.post("/brandData");
            setBrands(Array.isArray(res?.data?.data) ? res.data.data : []);
        } catch (error) {
            console.error(error);
            setBrands([]);
        }
    }

    const fetchTypes = async () => {
        try {
            const res = await axios.post("/marketSampTypeData");
            setTypes(Array.isArray(res?.data?.data) ? res.data.data : []);
        } catch (error) {
            console.error(error);
            setTypes([]);
        }
    }

    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editMarketingInput", { id: decodedId })
            const data = res?.data?.data || [];
            if (data.length > 0) {
                const d = {
                    brand: data[0]?.subcat_id || "",
                    relateTo: String(data[0]?.relation_type ?? "0"),
                    type: data[0]?.type && Number(data[0].type) !== 0 ? data[0].type : "",
                    description: data[0]?.Description || "",
                };
                setFormData(d);
                setoriginal(d);
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    useEffect(() => {
        fetchTableData();
        fetchBrands();
        fetchTypes();
    }, []);

    useEffect(() => {
        if (!decodedId) {
            setFormData(emptyForm);
            setoriginal(emptyForm)
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    const isUnchanged =
        String(original.brand) === String(formData.brand) &&
        String(original.relateTo) === String(formData.relateTo) &&
        String(original.type) === String(formData.type) &&
        (original.description || "").trim() === (formData.description || "").trim();

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: "Marketing Input" },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">Marketing Input</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="marketing input tabs">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Marketing Input</Typography>
                        }
                        {/*---------------- Add / Edit section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel id="marketBrand-label">Brand</InputLabel>
                                    <Select id='marketBrand' label="Brand" labelId="marketBrand-label" variant="outlined" MenuProps={menuStyle}
                                        value={formData.brand} error={!!validation.brand}
                                        onChange={(e) => formDataChange("brand", e.target.value)}
                                    >
                                        <MenuItem style={{ fontSize: "11px" }} value="">Select Brand</MenuItem>
                                        {brands?.map((item, index) => (
                                            <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.sub_name}</MenuItem>
                                        ))}
                                    </Select>
                                    {validation.brand && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.brand}</span>}
                                </FormControl>

                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <FormControl>
                                        <FormLabel sx={{ fontSize: '0.85rem' }}>Related To</FormLabel>
                                        <RadioGroup row value={formData.relateTo}
                                            onChange={(e) => formDataChange("relateTo", e.target.value)}>
                                            <FormControlLabel value="0" control={<Radio size="small" />} label="Product" />
                                            <FormControlLabel value="1" control={<Radio size="small" />} label="General" />
                                        </RadioGroup>
                                    </FormControl>

                                    <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                                        <InputLabel id="marketType-label">Type</InputLabel>
                                        <Select id='marketType' label="Type" labelId="marketType-label" variant="outlined" MenuProps={menuStyle}
                                            value={formData.type}
                                            onChange={(e) => formDataChange("type", e.target.value)}
                                        >
                                            <MenuItem style={{ fontSize: "11px" }} value="">Select Type</MenuItem>
                                            {types?.map((item, index) => (
                                                <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.market_samp_type}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                <TextField
                                    value={formData.description}
                                    onChange={(e) => formDataChange("description", e.target.value.replace(/^\s+/, ""))}
                                    size='small' variant='outlined' label="Description"
                                    multiline minRows={3}
                                />
                            </Box>
                            {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained'>Create</Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Button
                                    onClick={() => showSubmitConfirmation()}
                                    sx={{ mt: 2, textTransform: 'none' }}
                                    color="primary"
                                    variant='contained'
                                    disabled={isUnchanged}
                                >
                                    Update
                                </Button>
                            )}
                        </TabPanel>
                        {/*---------------- View section--------------- */}
                        <TabPanel value="2" sx={{ padding: 0 }}>
                            <DataTable
                                columns={columns}
                                data={tableData}
                                loading={loading}
                            />
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

export default MarketingInput