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
const errStyle = { color: "#d32f2f", fontSize: "9px", paddingLeft: "12px" }
const linkBtnSx = { textTransform: 'none', textDecoration: 'underline', whiteSpace: 'nowrap', minWidth: 'auto' }

const INITIAL_FORM = { docCatId: "", subNames: [""], sortOrder: "0" }

const DocSubCat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [catList, setCatList] = useState([])
    const [subOptions, setSubOptions] = useState([])
    const [value, setValue] = useState('1');
    const [loading, setLoading] = useState(true)
    const [accStat, setAccStat] = useState(null);
    /*----------form fields ---------*/
    const [formData, setFormData] = useState(INITIAL_FORM)
    /*---------- original values for edit ---------*/
    const [original, setoriginal] = useState({ docCatId: "", subName: "" })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({ docCatId: "", subNames: [] })

    const resetValidations = () => setValidations({ docCatId: "", subNames: [] })

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;
    usePageTitle("Document Sub Category")

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
            title: `${decodedId ? "Edit" : "Add"} Document Sub Category`,
            message: `Are you sure you want to ${decodedId ? "Update" : "Add New"} Document Sub Category?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    /*----------check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = { docCatId: "", subNames: [] }
        if (!formData.docCatId) {
            newValidations.docCatId = "Select Document Category";
            isValid = false;
        }
        formData.subNames.forEach((name, index) => {
            if (!name || name.trim() === "") {
                newValidations.subNames[index] = "Enter Sub Category Name";
                isValid = false;
            } else if (/[^a-zA-Z0-9_\-\/ ]/.test(name)) {
                newValidations.subNames[index] = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
                isValid = false;
            }
        });
        setValidations(newValidations)
        return isValid;
    }

    /*----------payload---------*/
    const buildPayload = () => ({
        doc_cat_id: formData.docCatId,
        doc_sub_name: formData.subNames.map((n) => n.trim()),
        order: formData.sortOrder,
    })

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            const res = await axios.post("/addDocSubCategory", buildPayload())
            if (res?.data?.success) {
                showAlert.success("Document Sub Category Added successfully")
                setFormData(INITIAL_FORM);
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
                showAlert.error("Unable to Add Document Sub Category")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            const payload = { ...buildPayload(), id: decodedId }
            const res = await axios.post("/updateDocSubCategory", payload)
            if (res?.data?.success) {
                showAlert.success("Document Sub Category Updated successfully")
                setFormData(INITIAL_FORM);
                setValue('1')
                navigate(`/detailing/doc_sub_category`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                showAlert.error(error?.response?.data?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Unable to Update Document Sub Category")
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*----------hierarchy rows (PHP: Add Heirarchy / Remove)---------*/
    const addHierarchy = () => {
        setFormData((prev) => ({ ...prev, subNames: [...prev.subNames, ""] }))
    }

    const removeHierarchy = (index) => {
        setFormData((prev) => ({ ...prev, subNames: prev.subNames.filter((_, i) => i !== index) }))
        setValidations((prev) => ({ ...prev, subNames: prev.subNames.filter((_, i) => i !== index) }))
    }

    const changeSubName = (index, val) => {
        const onlyText = val.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
        setFormData((prev) => ({
            ...prev,
            subNames: prev.subNames.map((n, i) => (i === index ? onlyText : n))
        }))
        if (validation.subNames[index]) {
            setValidations((prev) => {
                const next = [...prev.subNames];
                next[index] = "";
                return { ...prev, subNames: next };
            })
        }
    }

    /*----------category change: sorting order options reload for that category---------*/
    const changeCategory = (val) => {
        setFormData((prev) => ({ ...prev, docCatId: val, sortOrder: "0" }))
        if (validation.docCatId) setValidations((prev) => ({ ...prev, docCatId: "" }))
    }

    /*----------for tab change---------*/
    const handleChange = (event, newValue) => setValue(newValue);

    /*----------table columns (PHP list: edit only, no delete)---------*/
    const columns = [
        { field: "index", headerName: "#", filterable: true, sortable: true },
        { field: "doc_cat_name", headerName: "Category Name", filterable: true, sortable: true },
        { field: "doc_sub_name", headerName: "Sub Category Name", filterable: true, sortable: true },
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
        navigate(`/detailing/doc_sub_category/${btoa(encodeId)}`)
    }

    /*---------- Clear (PHP: back to add mode) ---------*/
    const clearForm = () => {
        resetValidations();
        navigate(`/detailing/doc_sub_category`)
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
            const res = await axios.post("/getDocSubCategory");
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

    /*---------- fetch document categories ---------*/
    const fetchCategories = async () => {
        try {
            const res = await axios.post("/docCatList");
            setCatList(Array.isArray(res?.data?.data) ? res.data.data : []);
        } catch (error) {
            console.error(error);
            setCatList([]);
        }
    }

    /*---------- fetch sub categories of the selected category (sorting order options) ---------*/
    const fetchSubOptions = async (catId) => {
        try {
            const res = await axios.post("/getDocSubByCat", { doc_cat_id: catId });
            setSubOptions(Array.isArray(res?.data?.data) ? res.data.data : []);
        } catch (error) {
            console.error(error);
            setSubOptions([]);
        }
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editDocSubCategory", { id: decodedId })
            const data = res?.data?.data || [];
            if (data.length > 0) {
                // PHP: doc_sub_name is stored as "level1|level2|level3"
                const names = (data[0]?.doc_sub_name || "").split("|");
                setFormData({
                    docCatId: data[0]?.doc_cat_id || "",
                    subNames: names.length > 0 ? names : [""],
                    sortOrder: "0",
                });
                setoriginal({
                    docCatId: data[0]?.doc_cat_id || "",
                    subName: data[0]?.doc_sub_name || "",
                })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("Failed to load record for edit")
        }
    }

    useEffect(() => {
        fetchTableData();
        fetchCategories();
    }, []);

    /*---------- sorting order options follow the selected category ---------*/
    useEffect(() => {
        if (Number(formData.docCatId) > 0) fetchSubOptions(formData.docCatId);
        else setSubOptions([]);
    }, [formData.docCatId]);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData(INITIAL_FORM);
            setoriginal({ docCatId: "", subName: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    /*---------- update enabled only when something changed ---------*/
    const isEdited =
        String(formData.docCatId) !== String(original.docCatId) ||
        formData.subNames.map((n) => n.trim()).join("|") !== original.subName.trim() ||
        formData.sortOrder !== "0";

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Detailing", path: location.pathname },
            { label: "Document Sub Category" },
        ]}>
            <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                <Box>
                    <h1 className="mainTitle">Document Sub Category</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="document sub category tabs">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Document Sub Category</Typography>
                        }
                        {/*---------------- Add / Edit section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {/* document category */}
                                <FormControl fullWidth size="small" required>
                                    <InputLabel id="docCat">Document Category</InputLabel>
                                    <Select id='docCat-select' label="Document Category" labelId="docCat" variant="outlined" MenuProps={menuStyle}
                                        value={formData.docCatId} error={!!validation.docCatId}
                                        onChange={(e) => changeCategory(e.target.value)}
                                    >
                                        <MenuItem style={{ fontSize: "11px" }} value="">Select Document Category</MenuItem>
                                        {catList?.map((item) => (
                                            <MenuItem key={item.id} style={{ fontSize: "11px" }} value={item.id}>{item?.doc_cat_name}</MenuItem>
                                        ))}
                                    </Select>
                                    {validation.docCatId && <span style={errStyle}>{validation.docCatId}</span>}
                                </FormControl>

                                {/* sub category name + hierarchy rows */}
                                {formData.subNames.map((name, index) => (
                                    <Box key={index} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                        <TextField
                                            value={name}
                                            onChange={(e) => changeSubName(index, e.target.value)}
                                            required={index === 0} size='small' variant='outlined' fullWidth
                                            label={index === 0 ? "Sub Category Name" : ``}
                                            placeholder="Enter Sub Category Name"
                                            error={!!validation.subNames[index]}
                                            helperText={validation.subNames[index] && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.subNames[index]}</span>}
                                        />
                                        {index === 0 ? (
                                            <Button onClick={addHierarchy} size="small" sx={{ ...linkBtnSx, mt: 0.5 }}>Add Hierarchy</Button>
                                        ) : (
                                            <Button onClick={() => removeHierarchy(index)} size="small" color="error" sx={{ ...linkBtnSx, mt: 0.5 }}>Remove</Button>
                                        )}
                                    </Box>
                                ))}

                                {/* sorting order (sub categories of the selected category) */}
                                <FormControl fullWidth size="small">
                                    <InputLabel id="sortOrder">Sorting Order</InputLabel>
                                    <Select id='sortOrder-select' label="Sorting Order" labelId="sortOrder" variant="outlined" MenuProps={menuStyle}
                                        value={formData.sortOrder}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: e.target.value }))}
                                    >
                                        <MenuItem style={{ fontSize: "11px" }} value="0">Select Ordering</MenuItem>
                                        {subOptions?.map((item) => (
                                            <MenuItem key={item.id} style={{ fontSize: "11px" }} value={String(item.id)}>{item?.doc_sub_name}</MenuItem>
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
                                            disabled={!isEdited}
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

export default DocSubCat