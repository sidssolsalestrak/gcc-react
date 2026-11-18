import React, { useState, useEffect } from 'react'
import Layout from '../../layout'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../utils/dataTable';
import axios from "../../services/api";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useToast from "../../utils/useToast";
import ConfirmationDialog from "../../utils/confirmDialog";
import { MdOutlineEdit } from "react-icons/md";
import usePageTitle from '../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }
const menuStyle = { PaperProps: { style: { maxHeight: 200 } } }

const DocCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [value, setValue] = useState('1');
    const [loading, setLoading] = useState(true)
    const [accStat, setAccStat] = useState(null);
    /*----------form fields ---------*/
    const [formData, setFormData] = useState({ catName: "", sortOrder: "0" })
    /*---------- original name for edit ---------*/
    const [original, setoriginal] = useState({ catName: "" })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({ catName: "" })

    const resetValidations = () => setValidations({ catName: "" })

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;
    usePageTitle("Document Category")

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
        setConfirmationDialog({ ...confirmationDialog, ...config, open: true });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({ ...confirmationDialog, open: false });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} Document Category`,
            message: `Are you sure you want to ${decodedId ? "Update" : "Add New"} Document Category?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    /*----------check validations (PHP: Enter Category Name) ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = { catName: "" }
        if (!formData.catName || formData.catName.trim() === "") {
            newValidations.catName = "Enter Category Name";
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(formData.catName)) {
            newValidations.catName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            const payload = { doc_cat_name: formData.catName, order: formData.sortOrder }
            const res = await axios.post("/addDocCategory", payload)
            if (res?.data?.success) {
                showAlert.success("Document Category Added successfully")
                setFormData({ catName: "", sortOrder: "0" });
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
                showAlert.error("Unable to Add Document Category")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            const payload = { id: decodedId, doc_cat_name: formData.catName, order: formData.sortOrder }
            const res = await axios.post("/updateDocCategory", payload)
            if (res?.data?.success) {
                showAlert.success("Document Category Updated successfully")
                setFormData({ catName: "", sortOrder: "0" });
                setValue('1')
                navigate(`/detailing/doc_category`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                showAlert.error(error?.response?.data?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Unable to Update Document Category")
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*----------for tab change---------*/
    const handleChange = (event, newValue) => setValue(newValue);

    /*----------table columns (PHP list: edit only, no delete)---------*/
    const columns = [
        { field: "index", headerName: "#", filterable: true, sortable: true },
        { field: "doc_cat_name", headerName: "Category Name", filterable: true, sortable: true },
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
                </>
            )
        },
    ]

    const editdata = (row) => {
        const encodeId = row?.row?.id
        resetValidations();
        navigate(`/detailing/doc_category/${btoa(encodeId)}`)
    }

    /*---------- Clear (PHP: back to add mode) ---------*/
    const clearForm = () => {
        resetValidations();
        navigate(`/detailing/doc_category`)
    }

    /*---------- fetch table data ---------*/
    const applyAccStat = (stat) => {
        if (stat !== null && stat !== undefined) {
            setAccStat(String(stat));
            localStorage.setItem("acc_stat", stat);
        }
    }

    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getDocCategory");
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
            setLoading(false)
        }
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editDocCategory", { id: decodedId })
            const data = res?.data?.data || [];
            if (data.length > 0) {
                setFormData({ catName: data[0]?.doc_cat_name || "", sortOrder: "0" });
                setoriginal({ catName: data[0]?.doc_cat_name || "" })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("Failed to load record for edit")
        }
    }

    useEffect(() => {
        fetchTableData();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData({ catName: "", sortOrder: "0" });
            setoriginal({ catName: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Detailing", path: location.pathname },
            { label: "Document Category" },
        ]}>
            <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                <Box>
                    <h1 className="mainTitle">Document Category</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="document category tabs">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Document Category</Typography>
                        }
                        {/*---------------- Add / Edit section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField
                                    value={formData.catName}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                        setFormData((prev) => ({ ...prev, catName: onlyText }))
                                        if (validation.catName) resetValidations();
                                    }}
                                    required size='small' variant='outlined' label="Category Name"
                                    placeholder="Enter Category Name"
                                    error={!!validation.catName}
                                    helperText={validation.catName && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.catName}</span>}
                                />
                                <FormControl fullWidth size="small">
                                    <InputLabel id="sortOrder">Sorting Order</InputLabel>
                                    <Select id='sortOrder-select' label="Sorting Order" labelId="sortOrder" variant="outlined" MenuProps={menuStyle}
                                        value={formData.sortOrder}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: e.target.value }))}
                                    >
                                        <MenuItem style={{ fontSize: "11px" }} value="0">Select Ordering</MenuItem>
                                        {tableData?.map((item) => (
                                            <MenuItem key={item.id} style={{ fontSize: "11px" }} value={String(item.id)}>{item?.doc_cat_name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                                {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                    <Button onClick={() => showSubmitConfirmation()} sx={{ textTransform: 'none' }} color="primary" variant='contained'>Submit</Button>
                                )}
                                {(decodedId && [0, 2].includes(Number(accStat))) && (
                                    <>
                                        <Button
                                            onClick={() => showSubmitConfirmation()}
                                            sx={{ textTransform: 'none' }}
                                            color="primary"
                                            variant='contained'
                                            disabled={
                                                original.catName.trim() === formData.catName.trim() &&
                                                formData.sortOrder === "0"
                                            }
                                        >
                                            Update
                                        </Button>
                                        <Button onClick={clearForm} sx={{ textTransform: 'none' }} color="success" variant='contained'>Clear</Button>
                                    </>
                                )}
                            </Box>
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

export default DocCategory