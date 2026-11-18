import React, { useState, useEffect } from 'react'
import Layout from '../../layout'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../utils/dataTable';
import axios from "../../services/api";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useToast from "../../utils/useToast";
import ConfirmationDialog from "../../utils/confirmDialog";
import { MdOutlineEdit } from "react-icons/md";
import usePageTitle from '../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

// PHP: 8 => HCP, 9 => KAM
const typeOptions = [
    { value: "8", label: "HCP" },
    { value: "9", label: "KAM" },
]

const CoachingCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [value, setValue] = useState('1');
    const [loading, setLoading] = useState(true)
    const [accStat, setAccStat] = useState(null);
    /*----------form fields ---------*/
    const [formData, setFormData] = useState({
        categoryName: "",
        catType: "8",
    })
    /*---------- original values for edit ---------*/
    const [original, setoriginal] = useState({
        categoryName: "",
        catType: "8",
    })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({
        categoryName: "",
        catType: "",
    })

    const resetValidations = () => {
        setValidations({ categoryName: "", catType: "" })
    }

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;
    usePageTitle("Coaching Category")

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

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} Coaching Category`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Coaching Category`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    /*----------check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = { categoryName: "", catType: "" }
        if (!formData.categoryName || formData.categoryName.trim() === "") {
            newValidations.categoryName = "The Coaching Category field is required.";
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(formData.categoryName)) {
            newValidations.categoryName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
            isValid = false;
        }
        if (!formData.catType) {
            newValidations.catType = "The Type field is required";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            let payload = {
                coaching_cat_name: formData.categoryName,
                user_type: formData.catType,
            }
            const res = await axios.post("/addCoachingCategory", payload)
            if (res?.data?.success) {
                showAlert.success("Coaching Category added successfully")
                setFormData({ categoryName: "", catType: "8" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to ADD Coaching Category")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            let payload = {
                id: decodedId,
                coaching_cat_name: formData.categoryName,
                user_type: formData.catType,
                hdnData: original.categoryName,
            }
            const res = await axios.post("/updateCoachingCategory", payload)
            if (res?.data?.success) {
                showAlert.success("Coaching Category Updated successfully")
                setFormData({ categoryName: "", catType: "8" });
                setValue('1')
                navigate(`/masters/category`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to Update Coaching Category")
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- delete ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            const res = await axios.post(`/deleteCoachingCategory/${id}`);
            if (res?.data?.success) {
                showAlert.success("Successfully Deleted Coaching Category")
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*----------for formdata onchange---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    /*----------for tab change---------*/
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    /*----------table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
            sortable: true,
        },
        {
            field: "coaching_cat_name",
            headerName: "Category Name",
            filterable: true,
            sortable: true,
        },
        {
            field: "user_type_label",
            headerName: "Type",
            filterable: true,
            sortable: true,
        },
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
    ]

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/category/${btoa(encodeId)}`)
    }

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getCoachingCategory");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1,
                // PHP list: 8 => Med.Rep, otherwise KAM
                user_type_label: Number(row.user_type) === 8 ? "Med.Rep" : "KAM",
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

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editCoachingCategory", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                const vals = {
                    categoryName: data[0]?.coaching_cat_name || "",
                    catType: String(data[0]?.user_type || "8"),
                };
                setFormData(vals);
                setoriginal(vals);
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    /*---------- Fetch table data ---------*/
    useEffect(() => {
        fetchTableData();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData({ categoryName: "", catType: "8" });
            setoriginal({ categoryName: "", catType: "8" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Coaching", path: location.pathname },
            { label: "Coaching Category" },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">Coaching Category</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="coaching category tabs">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Coaching Category</Typography>
                        }
                        {/*---------------- Add section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField value={formData.categoryName}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                        formDataChange("categoryName", onlyText)
                                    }}
                                    required size='small'
                                    variant='outlined' label="Coaching Category Name" error={!!validation.categoryName}
                                    helperText={validation.categoryName && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.categoryName}</span>} />

                                <FormControl fullWidth size="small" required>
                                    <InputLabel id="catType">Type</InputLabel>
                                    <Select id='catType-select' label="Type" labelId="catType" variant="outlined"
                                        value={formData.catType} error={!!validation.catType}
                                        onChange={(e) => formDataChange("catType", e.target.value)}
                                    >
                                        {typeOptions.map((item) => (
                                            <MenuItem key={item.value} style={{ fontSize: "11px" }} value={item.value}>{item.label}</MenuItem>
                                        ))}
                                    </Select>
                                    {validation.catType && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.catType}</span>}
                                </FormControl>
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
                                    disabled={
                                        String(original.catType) === String(formData.catType) &&
                                        original.categoryName.toLowerCase().trim() === formData.categoryName.toLowerCase().trim()
                                    }
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

export default CoachingCategory