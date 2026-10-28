import React, { useEffect, useState, useCallback } from 'react'
import Layout from '../../../layout'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Typography } from '@mui/material'
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

const menuStyle = {
    PaperProps: {
        style: {
            maxHeight: 200
        }
    }
}

const ProductSubCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [catData, setCatData] = useState([])
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);

    // labels derived from masterPanel with fallbacks
    const subCatLabel = masterPanel["PSUB"] || "Product Sub Category";
    const catLabel = masterPanel["PCAT"] || "Category";
    usePageTitle(subCatLabel)

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
                    menu_url: "masters/catSub",
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

    /*----------form fields ---------*/
    const [formData, setFormData] = useState({
        category: "",
        categoryName: ""
    })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({
        category: "",
        categoryName: ""
    })
    /*---------- original values for edit---------*/
    const [original, setoriginal] = useState({
        category: "",
        catname: ""
    })

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

    /*---------- re usable toast ---------*/
    const showAlert = useToast();

    /*----------reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            category: "",
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
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} ${subCatLabel}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete ${subCatLabel}`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    /*----------check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = {
            category: "",
            categoryName: ""
        }
        if (!formData.category) {
            newValidations.category = `The ${catLabel} field is required`;
            isValid = false;
        }

        if (!formData.categoryName || formData.categoryName.trim() === "") {
            newValidations.categoryName = `The ${subCatLabel} field is required.`;
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(formData.categoryName)) {
            newValidations.categoryName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
            isValid = false;
        }

        setValidations(newValidations)
        return isValid;
    }

    /*----------for formdata onchange---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    /*----------for tab change---------*/
    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/catSub/${btoa(encodeId)}`)
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                cat_id: formData.category,
                sub_name: formData.categoryName
            }
            const res = await axios.post("/addCatSub", payload)
            if (res?.data?.success) {
                showAlert.success(`${subCatLabel} Added Successfully`)
                setFormData({ category: "", categoryName: "" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) setValidations(prev => ({ ...prev, category: val?.message || "" }));
                else if (val?.type === 2) setValidations(prev => ({ ...prev, categoryName: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to ADD ${subCatLabel}`)
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
                cat_id: formData.category,
                hdnSubName: original.catname,
                sub_name: formData.categoryName
            }
            const res = await axios.post("/subCatEdit", payload)
            if (res?.data?.success) {
                showAlert.success(`${subCatLabel} Updated Successfully`)
                setFormData({ category: "", categoryName: "" });
                setValue('1')
                navigate(`/masters/catSub`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) setValidations(prev => ({ ...prev, category: val?.message || "" }));
                else if (val?.type === 2) setValidations(prev => ({ ...prev, categoryName: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${subCatLabel}`)
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editCatSub", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    category: data[0]?.cat_id || "",
                    categoryName: data[0]?.sub_name || ""
                });
                setoriginal({
                    category: data[0]?.cat_id || "",
                    catname: data[0]?.sub_name || ""
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
            const res = await axios.post(`/deleteCatSub/${id}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${subCatLabel}`)
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error(error?.response?.data?.message || "failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*----------table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
            sortable: true,
        },
        {
            field: "cat_name",
            headerName: `${catLabel} Name`,
            filterable: true,
            sortable: true,
        },
        {
            field: "sub_name",
            headerName: `${subCatLabel} Name`,
            filterable: true,
            sortable: true,
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

    /*---------- fetch category ---------*/
    const fetchCategory = async () => {
        try {
            const res = await axios.post("/getCategory");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
            setCatData(data);
        } catch (error) {
            console.error(error);
            setCatData([]);
        }
    }

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getSubCat");
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
        fetchCategory();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData({ category: "", categoryName: "" });
            setoriginal({ category: "", catname: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    const isEdited =
        String(formData.category) !== String(original.category) ||
        formData.categoryName.trim() !== original.catname.trim();

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: subCatLabel },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{subCatLabel}</h1>
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
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {subCatLabel}</Typography>
                        }
                        {/*---------------- Add section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel id="Category">{catLabel}</InputLabel>
                                    <Select id='Category-select' label={catLabel} labelId="Category" variant="outlined"
                                        value={formData.category} error={!!validation.category} MenuProps={menuStyle}
                                        onChange={(e) => formDataChange("category", e.target.value)}
                                    >
                                        <MenuItem style={{ fontSize: "11px" }} value="">Select {catLabel}</MenuItem>
                                        {catData?.map((item, index) => (
                                            <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>
                                                {item?.cat_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {validation.category && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.category}</span>}
                                </FormControl>
                                <TextField
                                    value={formData.categoryName}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                        formDataChange("categoryName", onlyText)
                                    }}
                                    required size='small'
                                    variant='outlined' label={`${subCatLabel} Name`}
                                    placeholder={`Enter ${subCatLabel} Name`}
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
export default ProductSubCategory