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

const TYPE_OPTIONS = [
    { id: "0", label: "All" },
    { id: "8", label: "Med.Rep" },
    { id: "9", label: "KAM" },
    { id: "10", label: "Merchandiser" },
]

const getTypeLabel = (type) => {
    const found = TYPE_OPTIONS.find((t) => String(t.id) === String(type))
    return found ? found.label : "-"
}

export default function Objective() {

    const { editObjId } = useParams()
    const decodedEditObjId = editObjId !== undefined && editObjId !== null ? Number(atob(editObjId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [selType, setSelType] = useState("0")
    const [hdnSelType, setHdnSelType] = useState("0")
    const [objName, setObjName] = useState("")
    const [hdnObjName, setHdnObjName] = useState("")

    const [allObjData, setAllObjData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [typeError, setTypeError] = useState(false)
    const [objError, setObjError] = useState(false)
    const [objErrorMsg, setObjErrorMsg] = useState("")

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const objLabel = masterPanel["OBJE"] || "Objective";
    usePageTitle(objLabel || "Objective")

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllObjective()
    }, [])

    useEffect(() => {
        if (!decodedEditObjId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditObjId)
        // eslint-disable-next-line
    }, [decodedEditObjId])

    const resetFields = () => {
        setSelType("0"); setHdnSelType("0")
        setObjName(""); setHdnObjName("")
        setTypeError(false)
        setObjError(false); setObjErrorMsg("")
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchAllObjective = async () => {
        try {
            let response = await api.post("/readObjective", { obj_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllObjData(data.map((item, index) => ({
                ...item,
                si_no: index + 1,
                type_name: getTypeLabel(item.user_type)
            })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllObjective error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readObjective", { obj_id: id })
            let data = response.data.data[0]
            setSelType(String(data.user_type))
            setHdnSelType(String(data.user_type))
            setObjName(data.call_obj || "")
            setHdnObjName(data.call_obj || "")
            setTypeError(false)
            setObjError(false); setObjErrorMsg("")
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        let isValid = true
        setTypeError(false)
        setObjError(false); setObjErrorMsg("")

        if (!TYPE_OPTIONS.some((t) => t.id === String(selType))) {
            setTypeError(true)
            isValid = false
        }

        if (!objName || objName.trim() === "") {
            setObjError(true)
            setObjErrorMsg(`The ${objLabel} field is required.`)
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
                call_obj: objName.trim()
            }

            if (decodedEditObjId) {
                let check = hdnObjName.toLowerCase().trim() === objName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/objectiveUpdate", { id: decodedEditObjId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllObjective()
                    navigate('/masters/objective')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/objectiveCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllObjective()
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
        navigate(`/masters/objective/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteObjective", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllObjective()
        } catch (err) {
            console.log("deleteObjective error", err)
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
            title: `${decodedEditObjId ? "Edit" : "Add"} ${objLabel}`,
            message: `Are you sure you want to ${decodedEditObjId ? "Edit" : "Add"} this ${objLabel}?`,
            confirmText: decodedEditObjId ? "Update" : "Add",
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
        hdnObjName.toLowerCase().trim() === objName.toLowerCase().trim()

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "type_name", headerName: "Type", filterable: true, sortable: true },
        { field: "call_obj", headerName: objLabel, filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.objID)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>}
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.objID)}>
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
                { label: "Master", path: "/masters/objective" },
                { label: objLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{objLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditObjId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {objLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <Autocomplete
                                options={TYPE_OPTIONS}
                                getOptionLabel={(option) => option.label || ""}
                                value={TYPE_OPTIONS.find((t) => t.id === String(selType)) || null}
                                onChange={(e, newVal) => {
                                    setSelType(newVal ? newVal.id : "0")
                                    if (typeError) setTypeError(false)
                                }}
                                disableClearable
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Type"
                                        size="small"
                                        required
                                        error={typeError}
                                        helperText={typeError ? "The Type field is required." : ""}
                                    />
                                )}
                            />

                            <TextField
                                label={objLabel}
                                size="small"
                                placeholder={`Enter ${objLabel}`}
                                value={objName}
                                onChange={(e) => {
                                    setObjName(e.target.value.replace(/^\s+/, ""))
                                    if (objError) { setObjError(false); setObjErrorMsg("") }
                                }}
                                error={objError}
                                required
                                helperText={objError ? objErrorMsg : ""}
                            />

                            {!decodedEditObjId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Create
                                </Button>
                            }
                            {decodedEditObjId && [0, 2].includes(Number(accStat)) &&
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
                            <DataTable columns={columns} data={allObjData} loading={loading} />
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