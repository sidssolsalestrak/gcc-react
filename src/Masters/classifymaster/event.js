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
    { id: "8", label: "Med.Rep" },
    { id: "9", label: "KAM" },
    { id: "10", label: "Merchandiser" },
]

const getTypeLabel = (type) => {
    const found = TYPE_OPTIONS.find((t) => String(t.id) === String(type))
    return found ? found.label : ""
}

export default function Event() {

    const { editEventId } = useParams()
    const decodedEditEventId = editEventId !== undefined && editEventId !== null ? Number(atob(editEventId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [eventName, setEventName] = useState("")
    const [hdnEventName, setHdnEventName] = useState("")
    const [selType, setSelType] = useState("8")
    const [hdnSelType, setHdnSelType] = useState("8")

    const [allEventData, setAllEventData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [eventError, setEventError] = useState(false)
    const [eventErrorMsg, setEventErrorMsg] = useState("")
    const [typeError, setTypeError] = useState(false)

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const eventLabel = masterPanel["ETYP"] || "Event Type";
    usePageTitle(eventLabel || "Event Type")

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllEvent()
    }, [])

    useEffect(() => {
        if (!decodedEditEventId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditEventId)
        // eslint-disable-next-line
    }, [decodedEditEventId])

    const resetFields = () => {
        setEventName(""); setHdnEventName("")
        setSelType("8"); setHdnSelType("8")
        setEventError(false); setEventErrorMsg("")
        setTypeError(false)
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchAllEvent = async () => {
        try {
            let response = await api.post("/readEvent", { event_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllEventData(data.map((item, index) => ({
                ...item,
                si_no: index + 1,
                type_name: getTypeLabel(item.user_type)
            })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllEvent error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readEvent", { event_id: id })
            let data = response.data.data[0]
            setEventName(data.event_type || "")
            setHdnEventName(data.event_type || "")
            setSelType(String(data.user_type))
            setHdnSelType(String(data.user_type))
            setEventError(false); setEventErrorMsg("")
            setTypeError(false)
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        let isValid = true
        setEventError(false); setEventErrorMsg("")
        setTypeError(false)

        if (!eventName || eventName.trim() === "") {
            setEventError(true)
            setEventErrorMsg(`The ${eventLabel} field is required.`)
            isValid = false
        }

        if (!TYPE_OPTIONS.some((t) => t.id === String(selType))) {
            setTypeError(true)
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
                event_type: eventName.trim(),
                user_type: selType
            }

            if (decodedEditEventId) {
                let check = hdnEventName.toLowerCase().trim() === eventName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/eventUpdate", { id: decodedEditEventId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllEvent()
                    navigate('/masters/event')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/eventCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllEvent()
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
        navigate(`/masters/event/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteEvent", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllEvent()
        } catch (err) {
            console.log("deleteEvent error", err)
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
            title: `${decodedEditEventId ? "Edit" : "Add"} ${eventLabel}`,
            message: `Are you sure you want to ${decodedEditEventId ? "Edit" : "Add"} this ${eventLabel}?`,
            confirmText: decodedEditEventId ? "Update" : "Add",
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
        hdnEventName.toLowerCase().trim() === eventName.toLowerCase().trim()

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "event_type", headerName: eventLabel, filterable: true, sortable: true },
        { field: "type_name", headerName: "Type", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.eventID)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>}
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.eventID)}>
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
                { label: "Master", path: "/masters/event" },
                { label: eventLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{eventLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditEventId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {eventLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <TextField
                                label={eventLabel}
                                size="small"
                                placeholder={`Enter ${eventLabel}`}
                                value={eventName}
                                onChange={(e) => {
                                    setEventName(e.target.value.replace(/^\s+/, ""))
                                    if (eventError) { setEventError(false); setEventErrorMsg("") }
                                }}
                                error={eventError}
                                required
                                helperText={eventError ? eventErrorMsg : ""}
                            />

                            <Autocomplete
                                options={TYPE_OPTIONS}
                                getOptionLabel={(option) => option.label || ""}
                                value={TYPE_OPTIONS.find((t) => t.id === String(selType)) || null}
                                onChange={(e, newVal) => {
                                    setSelType(newVal ? newVal.id : "8")
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

                            {!decodedEditEventId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Create
                                </Button>
                            }
                            {decodedEditEventId && [0, 2].includes(Number(accStat)) &&
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
                            <DataTable columns={columns} data={allEventData} loading={loading} />
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