import React, { useCallback, useEffect, useState } from 'react'
import Layout from '../../../layout'
import { Box, TextField, Button, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from "../../../services/api";
import useToast from "../../../utils/useToast";
import { MdOutlineEdit } from 'react-icons/md';
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmationDialog from "../../../utils/confirmDialog";
import { getMasterPanel } from "../../../services/masterPanelService";
import usePageTitle from '../../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const PrincipleSupplier = () => {
    const { editid } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);

    const supLabel = masterPanel["PRSUP"] || "Principle Supplier";
    usePageTitle(supLabel)

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    const [formData, setFormData] = useState({
        code: "",
        name: ""
    })
    const [validation, setValidations] = useState({
        code: "",
        name: ""
    })
    const [original, setoriginal] = useState({
        code: "",
        name: ""
    })

    const decodedId =  editid ? atob(editid) : null;

    const resetValidations = () => {
        setValidations({
            code: "",
            name: ""
        })
    }

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

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} ${supLabel}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete ${supLabel}`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    const validations = () => {
        let isValid = true;
        const newValidations = {
            code: "",
            name: ""
        }
        if (!formData.code || formData.code.trim() === "") {
            newValidations.code = `Please Enter ${supLabel} Code`;
            isValid = false;
        }
        if (!formData.name || formData.name.trim() === "") {
            newValidations.name = `Please Enter ${supLabel} Name`;
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                main_id: 0,
                prod_main_code: formData.code,
                prod_main_name: formData.name
            }
            const res = await axios.post("/addPrincipleSupplier", payload)
            if (res?.data?.success) {
                showAlert.success(`${supLabel} Added Successfully`)
                setFormData({ code: "", name: "" });
                fetchTableData();
                resetValidations();
            } else if (res?.data?.status === 100) {
                setValidations(prev => ({ ...prev, code: res?.data?.message }))
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Add ${supLabel}`)
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    const onEdit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                main_id: decodedId,
                prod_main_code: formData.code,
                prod_main_name: formData.name,
                HDNprod_main_name: original.name
            }
            const res = await axios.post("/UpdatePrincipleSupplier", payload)
            if (res?.data?.success) {
                showAlert.success(`${supLabel} Updated Successfully`)
                setFormData({ code: "", name: "" });
                setValue('1')
                navigate(`/masters/principle_supplier`)
            } else if (res?.data?.status === 100) {
                setValidations(prev => ({ ...prev, code: res?.data?.message }))
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${supLabel}`)
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/deletePrincipleSupplier`,{id:id});
            if (res?.data?.code === 1) {
                showAlert.success(`Successfully Deleted ${supLabel}`)
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
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
            sortable: true,
        },
        {
            field: "prod_main_code",
            headerName: `${supLabel} Code`,
            filterable: true,
            sortable: true,
        },
        {
            field: "prod_main_name",
            headerName: `${supLabel} Name`,
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
                    <IconButton className='updateBtn' size="small" onClick={() => editdata(row)}>
                        <MdOutlineEdit size={15} />
                    </IconButton>
                    {[0, 2].includes(Number(accStat)) && (
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row)}>
                            <DeleteIcon size={15} />
                        </IconButton>
                    )}
                </>
            )
        },
    ]

    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getprodmain",{id:0});
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
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

    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/getprodmain", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    code: data[0]?.prod_main_code || "",
                    name: data[0]?.prod_main_name || "",
                });
                setoriginal({
                    code: data[0]?.prod_main_code || "",
                    name: data[0]?.prod_main_name || "",
                })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/principle_supplier/${btoa(encodeId)}`)
    }

    const clearData = () => {
        navigate(`/masters/principle_supplier`)
    }

    useEffect(() => {
        fetchTableData();
    }, []);

    useEffect(() => {
        if (!decodedId) {
            setFormData({ code: "", name: "" });
            setoriginal({ code: "", name: "" });
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    const isEdited =
        formData.code.trim() !== original.code.trim() ||
        formData.name.trim() !== original.name.trim();

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Masters", path: location.pathname },
            { label: supLabel },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{supLabel}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '98%', xs: '98%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box>
                            : <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {supLabel}</Typography>
                        }
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField
                                    value={formData.code}
                                    onChange={(e) => formDataChange("code", e.target.value)}
                                    required size='small' placeholder={`Enter ${supLabel} Code`}
                                    variant='outlined' label={`${supLabel} Code`} error={!!validation.code}
                                    helperText={validation.code && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.code}</span>} />
                                <TextField
                                    value={formData.name}
                                    onChange={(e) => formDataChange("name", e.target.value)}
                                    required size='small' placeholder={`Enter ${supLabel} Name`}
                                    variant='outlined' label={`${supLabel} Name`} error={!!validation.name}
                                    helperText={validation.name && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.name}</span>} />
                            </Box>
                            {(!decodedId && [0, 1].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained'>Submit</Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained' disabled={!isEdited}>Update</Button>
                                </Box>
                            )}
                        </TabPanel>
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

export default PrincipleSupplier