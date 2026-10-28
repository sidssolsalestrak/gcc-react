import React, { useEffect, useState, useCallback } from 'react'
import Layout from '../../../layout'
import { Box, TextField, Button, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import axios from "../../../services/api";
import { MdOutlineEdit } from 'react-icons/md';
import DeleteIcon from "@mui/icons-material/Delete";
import useToast from "../../../utils/useToast";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmationDialog from "../../../utils/confirmDialog";
import { getMasterPanel } from "../../../services/masterPanelService";
import usePageTitle from '../../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const ProductCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([]);
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);

    usePageTitle(masterPanel["PCAT"] || "Product Category")

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
                    menu_url: "masters/cat",
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

    /*---------- form fields ---------*/
    const [formData, setFormData] = useState({
        categoryName: ""
    })
    /*---------- original cat name for edit---------*/
    const [original, setoriginal] = useState({
        catname: ""
    })
    /*---------- form validations ---------*/
    const [validation, setValidations] = useState({
        categoryName: "",
    })
    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

    /*---------- re usable toast ---------*/
    const showAlert = useToast();

    /*---------- reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            categoryName: ""
        })
    }
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
            loading: false,
        });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        const label = masterPanel["PCAT"] || "Product Category";
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} ${label}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Category`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    /*---------- check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = {
            categoryName: ""
        }

        const label = masterPanel["PCAT"] || "Product Category";

        if (!formData.categoryName || formData.categoryName.trim() === "") {
            newValidations.categoryName = `The ${label} Name field is required`;
            isValid = false;
        } else if (formData.categoryName.trim().length < 3) {
            newValidations.categoryName = `${label} Name must be at least 3 characters`;
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(formData.categoryName)) {
            newValidations.categoryName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
            isValid = false;
        }

        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                cat_name: formData.categoryName
            }
            const res = await axios.post("/addCat", payload)
            if (res?.data?.success) {
                showAlert.success(`${masterPanel["PCAT"] || "Product Category"} Added Successfully`)
                setFormData({ categoryName: "" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                setValidations({ categoryName: val?.message || "" });
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to ADD ${masterPanel["PCAT"] || "Product Category"}`)
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                id: decodedId,
                hdnCatName: original.catname,
                cat_name: formData.categoryName
            }
            const res = await axios.post("/editCat", payload)
            if (res?.data?.success) {
                showAlert.success(`${masterPanel["PCAT"] || "Product Category"} Updated Successfully`)
                setFormData({ categoryName: "" });
                setValue('1')
                navigate(`/masters/cat`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                setValidations({ categoryName: val?.message || "" });
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${masterPanel["PCAT"] || "Product Category"}`)
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- for formdata onchange---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    /*---------- for tab change---------*/
    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/cat/${btoa(encodeId)}`)
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/edit", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    categoryName: data[0]?.cat_name || ""
                });
                setoriginal({
                    catname: data[0]?.cat_name || ""
                })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    /*---------- delete cat ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/deleteCat/${id}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${masterPanel["PCAT"] || "Product Category"}`)
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error(error?.response?.data?.message || "failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
            sortable: true
        },
        {
            field: "cat_name",
            headerName: masterPanel["PCAT"] || "Product Category",
            filterable: true,
            sortable: true
        }, {
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

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getCat");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            settableData(data);
        } catch (error) {
            console.error(error);
            settableData([]);
        } finally {
            setLoading(false)
        }
    }

    /*---------- Fetch table data ---------*/
    useEffect(() => {
        fetchTableData();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData({ categoryName: "" });
            setoriginal({ catname: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    const isEdited =
        formData.categoryName.trim() !== original.catname.trim();

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: masterPanel["PCAT"] ? `${masterPanel["PCAT"]}` : "Product Category" },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{masterPanel["PCAT"] || "Product Category"}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {masterPanel["PCAT"]} Details</Typography>
                        }
                        {/*---------------- Add section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField
                                    value={formData.categoryName}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                        formDataChange("categoryName", onlyText)
                                    }}
                                    required size='small'
                                    variant='outlined' label={masterPanel["PCAT"] ? `${masterPanel["PCAT"]} Name` : "Product Category Name"}
                                    placeholder={masterPanel["PCAT"] ? `Enter ${masterPanel["PCAT"]} Name` : "Enter Product Category Name"}
                                    error={!!validation.categoryName}
                                    helperText={validation.categoryName && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.categoryName}</span>} />
                            </Box>
                            {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained'>Submit</Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained' disabled={!isEdited}>Update</Button>
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
export default ProductCategory