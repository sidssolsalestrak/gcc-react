import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab,
    IconButton, Autocomplete
} from "@mui/material";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import ConfirmationDialog from "../../utils/confirmDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import { MdOutlineEdit } from "react-icons/md";
import { getMasterPanel } from "../../services/masterPanelService";
import usePageTitle from '../../services/usePageTitle'

export default function ExpenseDaType() {

    const { editId } = useParams()
    const decodedEditDaId = editId !== undefined && editId !== null ? Number(atob(editId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [selType, setSelType] = useState("")
    const [hdnSelType, setHdnSelType] = useState("")
    const [daName, setDaName] = useState("")
    const [hdnDaName, setHdnDaName] = useState("")
    const [daValue, setDaValue] = useState("")
    const [hdnDaValue, setHdnDaValue] = useState("")

    const [allDaData, setAllDaData] = useState([])
    const [typeOptions, setTypeOptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [typeError, setTypeError] = useState(false)
    const [daError, setDaError] = useState(false)
    const [daErrorMsg, setDaErrorMsg] = useState("")
    const [valError, setValError] = useState(false)

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const daLabel = masterPanel["EDAT"] || "Expense DA Type";
    usePageTitle(daLabel)

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchUserTypes()
        fetchAllDaType()
    }, [])

    useEffect(() => {
        if (!decodedEditDaId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditDaId)
        // eslint-disable-next-line
    }, [decodedEditDaId])

    const resetFields = () => {
        setSelType(""); setHdnSelType("")
        setDaName(""); setHdnDaName("")
        setDaValue(""); setHdnDaValue("")
        setTypeError(false)
        setDaError(false); setDaErrorMsg("")
        setValError(false)
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchUserTypes = async () => {
        try {
            let response = await api.post("/expDaTypeUserTypes")
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setTypeOptions(data.map((item) => ({
                id: String(item.id),
                label: item.client_alias || ""
            })))
        } catch (err) {
            console.log("fetch user types Err", err)
        }
    }

    const fetchAllDaType = async () => {
        try {
            let response = await api.post("/readExpDaType", { da_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllDaData(data.map((item, index) => ({
                ...item,
                si_no: index + 1
            })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllDaType error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readExpDaType", { da_id: id })
            let data = response.data.data[0]
            setSelType(String(data.user_type))
            setHdnSelType(String(data.user_type))
            setDaName(data.da_type || "")
            setHdnDaName(data.da_type || "")
            setDaValue(data.da_val !== null && data.da_val !== undefined ? String(data.da_val) : "")
            setHdnDaValue(data.da_val !== null && data.da_val !== undefined ? String(data.da_val) : "")
            setTypeError(false)
            setDaError(false); setDaErrorMsg("")
            setValError(false)
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        let isValid = true
        setTypeError(false)
        setDaError(false); setDaErrorMsg("")
        setValError(false)

        if (!typeOptions.some((t) => t.id === String(selType))) {
            setTypeError(true)
            isValid = false
        }

        if (!daName || daName.trim() === "") {
            setDaError(true)
            setDaErrorMsg(decodedEditDaId ? "The DA Type field is required." : "The DA Name field is required.")
            isValid = false
        }

        if (!daValue || daValue.trim() === "") {
            setValError(true)
            isValid = false
        }

        if (!isValid) {
            toast.error("Please fix all mandatory fields")
        }
        return isValid
    }

    const handleSubmit = async () => {
        try {
            setModifyLoading(true)
            const payload = {
                user_type: selType,
                da_type: daName.trim(),
                da_val: daValue.trim()
            }

            if (decodedEditDaId) {
                let check = hdnDaName.toLowerCase().trim() === daName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/expDaTypeUpdate", { id: decodedEditDaId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllDaType()
                    navigate('/Masters/expdatype')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/expDaTypeCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllDaType()
                    setTabValue(1)
                } else {
                    toast.error(response.data.message)
                }
            }
        } catch (err) {
            console.log(err)
            toast.error("Something went wrong Try again!!")
        } finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    }

    const handleEdit = (id) => {
        navigate(`/Masters/expdatype/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteExpDaType", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllDaType()
        } catch (err) {
            console.log("deleteExpDaType error", err)
            toast.error("Something went wrong Try again!!")
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    const showConfirmationDialog = (config) => {
        setConfirmationDialog(prev => ({ ...prev, ...config, open: true }))
    }

    const closeConfirmationDialog = () => {
        setConfirmationDialog(prev => ({ ...prev, open: false }))
    }

    const showSubmitConfirmation = () => {
        showConfirmationDialog({
            title: `${decodedEditDaId ? "Edit" : "Add"} ${daLabel}`,
            message: `Are you sure you want to ${decodedEditDaId ? "Edit" : "Add"} this ${daLabel}?`,
            confirmText: decodedEditDaId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => handleSubmit()
        })
    }

    const showDeleteConfirmation = (id) => {
        showConfirmationDialog({
            title: "Confirmation",
            message: "Are you sure you want to delete this record?",
            confirmText: "OK",
            cancelText: "Close",
            confirmColor: "primary",
            onConfirm: () => handleDelete(id)
        })
    }

    const isUnchanged =
        String(hdnSelType) === String(selType) &&
        hdnDaName.trim() === daName.trim() &&
        hdnDaValue.trim() === daValue.trim()

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "user_type_name", headerName: "User Type", filterable: true, sortable: true },
        { field: "da_type", headerName: "DA Type", filterable: true, sortable: true },
        { field: "da_val", headerName: "DA Value", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.daID)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>}
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.daID)}>
                            <DeleteIcon size={15} />
                        </IconButton>}
                </>
            )
        }
    ]

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Masters", path: "/Masters/expdatype" },
                { label: daLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{daLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditDaId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {daLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <Autocomplete
                                options={typeOptions}
                                getOptionLabel={(option) => option.label || ""}
                                value={typeOptions.find((t) => t.id === String(selType)) || null}
                                onChange={(e, newVal) => {
                                    setSelType(newVal ? newVal.id : "")
                                    if (typeError) setTypeError(false)
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="User Type"
                                        placeholder="Select User Type"
                                        size="small"
                                        required
                                        error={typeError}
                                        helperText={typeError ? "The User type field is required." : ""}
                                    />
                                )}
                            />

                            <TextField
                                label="DA Type"
                                size="small"
                                placeholder="Enter DA Type"
                                value={daName}
                                onChange={(e) => {
                                    setDaName(e.target.value.replace(/^\s+/, ""))
                                    if (daError) { setDaError(false); setDaErrorMsg("") }
                                }}
                                error={daError}
                                required
                                helperText={daError ? daErrorMsg : ""}
                            />

                            <TextField
                                label="DA Value"
                                size="small"
                                placeholder="Enter DA Value"
                                value={daValue}
                                onChange={(e) => {
                                    setDaValue(e.target.value.replace(/^\s+/, ""))
                                    if (valError) setValError(false)
                                }}
                                error={valError}
                                required
                                helperText={valError ? "The DA Value field is required." : ""}
                            />

                            {!decodedEditDaId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Submit
                                </Button>
                            }
                            {decodedEditDaId && [0, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    disabled={isUnchanged}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Update
                                </Button>}
                        </Box>
                    )}

                    {tabValue === 1 && (
                        <Box sx={{ p: 0 }}>
                            <DataTable columns={columns} data={allDaData} loading={loading} />
                        </Box>
                    )}
                </Box>

                <ConfirmationDialog
                    open={confirmationDialog.open}
                    onClose={closeConfirmationDialog}
                    onConfirm={confirmationDialog.onConfirm}
                    title={confirmationDialog.title}
                    message={confirmationDialog.message}
                    confirmText={confirmationDialog.confirmText}
                    cancelText={confirmationDialog.cancelText}
                    loading={modifyLoading}
                    confirmColor={confirmationDialog.confirmColor}
                />
            </Box>
        </Layout>
    )
}