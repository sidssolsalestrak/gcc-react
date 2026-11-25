import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab, IconButton, MenuItem, FormControl, Checkbox,
    ListItemText, Autocomplete
} from "@mui/material";
import api from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import DeleteIcon from "@mui/icons-material/Delete";
import { MdOutlineEdit } from "react-icons/md";
import ConfirmationDialog from "../../utils/confirmDialog";
import useToast from "../../utils/useToast";
import { getMasterPanel } from "../../services/masterPanelService";
import usePageTitle from "../../services/usePageTitle";

export default function EventMap() {

    const { userId } = useParams()
    const decodedUserId = userId !== undefined && userId !== null ? Number(atob(userId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(1)
    const [loading, setLoading] = useState(true)
    const [eventMapData, setEventMapData] = useState([])
    const [allUserType, setAllUserType] = useState([])
    const [allEvents, setAllEvents] = useState([])
    const [selUserType, setSelUserType] = useState(null)
    const [selUserName, setSelUserName] = useState("")
    const [selEvents, setSelEvents] = useState([])
    const [hdnSelEvents, setHdnSelEvents] = useState([])
    const [userTypeError, setUserTypeError] = useState(false)
    const [eventError, setEventError] = useState(false)

    const [masterPanel, setMasterPanel] = useState({});
    const mapLabel = masterPanel["EMAP"] || "Event Map"
    const userLabel = masterPanel["USER"] || "User"
    const eventLabel = masterPanel["ETYP"] || "Event"
    usePageTitle(mapLabel)

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    useEffect(() => {
        const fetchEventMapData = async () => {
            setLoading(true)
            try {
                let response = await api.post("/getEventMapData")
                let data = Array.isArray(response.data.data) ? response.data.data : []
                setEventMapData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
            } catch (err) {
                console.log("Fetching event map data Error", err)
            } finally {
                setLoading(false)
            }
        }
        const fetchInputData = async () => {
            try {
                let response = await api.post("/getEventMapInputData")
                setAllUserType(Array.isArray(response.data.userresdata) ? response.data.userresdata : [])
                setAllEvents(Array.isArray(response.data.eventData) ? response.data.eventData : [])
            } catch (err) {
                console.log("fetch Input Data Error", err)
            }
        }
        fetchEventMapData()
        fetchInputData()
    }, [])

    useEffect(() => {
        if (!decodedUserId) {
            setSelEvents([])
            setHdnSelEvents([])
            setSelUserType(null)
            setSelUserName("")
            setUserTypeError(false)
            setEventError(false)
            setTabValue(1)
            return
        }
        if (allUserType.length === 0) return
        const collectEditData = async () => {
            try {
                let response = await api.post("/getEventMapEditData", { uid: decodedUserId })
                let data = response.data.data
                const matchedUser = allUserType.find(u => Number(u.id) === Number(data[0].user_type)) || null
                setSelUserType(matchedUser)
                setSelUserName(matchedUser?.client_alias || "")
                let eventIds = String(data[0].event_id || "").split(',').filter(Boolean).map((val) => Number(val))
                setSelEvents(eventIds)
                setHdnSelEvents(eventIds)
                setTabValue(0)
            } catch (err) {
                console.log(err)
            }
        }
        collectEditData()
    }, [decodedUserId, allUserType])

    const handleSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }))
            let response = await api.post("/eventMapCreate", {
                userInputType: selUserType?.id,
                event_mode: selEvents.join(",")
            })
            if (response.data.success) {
                toast.success(decodedUserId ? `${mapLabel} Updated successfully` : response.data.message)
                let listRes = await api.post("/getEventMapData")
                let listData = Array.isArray(listRes.data.data) ? listRes.data.data : []
                setEventMapData(listData.map((item, index) => ({ ...item, si_no: index + 1 })))
                if (decodedUserId) {
                    navigate("/masters/mapevent")
                } else {
                    setSelEvents([])
                    setHdnSelEvents([])
                    setSelUserType(null)
                    setSelUserName("")
                    setTabValue(1)
                }
            } else {
                toast.error(response.data.message)
            }
        } catch (err) {
            console.log(err)
            toast.error("Something went wrong Try again!!")
        } finally {
            setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))
        }
    }

    const handleDelete = async (userId) => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }))
            let response = await api.post("/deleteEventMap", { uid: userId })
            if (response.data.success) {
                toast.success("Deleted Successfully")
                let listRes = await api.post("/getEventMapData")
                let listData = Array.isArray(listRes.data.data) ? listRes.data.data : []
                setEventMapData(listData.map((item, index) => ({ ...item, si_no: index + 1 })))
            } else {
                toast.error(response.data.message)
            }
        } catch (err) {
            console.log("Delete Error", err)
            toast.error("Something went wrong!")
        } finally {
            setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))
        }
    }

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "user_name", headerName: `${userLabel.toUpperCase()} TYPE`, filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    <IconButton className='updateBtn' size="small" onClick={() => {
                        setUserTypeError(false)
                        navigate(`/masters/mapevent/${btoa(row.row.user_type)}`)
                    }}>
                        <MdOutlineEdit size={15} />
                    </IconButton>
                    <IconButton className='deleteBtn' size="small" onClick={() => setConfirmationDialog(prev => ({
                        ...prev,
                        open: true,
                        title: "Confirmation",
                        message: "Are you sure you want to delete this record?",
                        confirmText: "OK",
                        cancelText: "Close",
                        confirmColor: "primary",
                        onConfirm: () => handleDelete(row.row.user_type)
                    }))}>
                        <DeleteIcon size={15} />
                    </IconButton>
                </>
            )
        }
    ]

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Master", path: '/masters/eventMap' },
                { label: "Admin Panel", path: '/masters/eventMap' },
                { label: mapLabel, path: '/masters/eventMap' },
            ]}
        >
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{mapLabel}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedUserId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {mapLabel}</Typography>
                    }
                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>

                            <Autocomplete
                                options={[{ id: "0", client_alias: `Select ${userLabel} Type` }, ...allUserType]}
                                getOptionLabel={(option) => option.client_alias || ""}
                                value={selUserType}
                                onChange={(e, newValue) => {
                                    setSelUserType(newValue)
                                    setSelUserName(newValue?.client_alias || "")
                                    setUserTypeError(false)
                                }}
                                readOnly={!!decodedUserId}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`${userLabel} Type`}
                                        size="small"
                                        required
                                        error={userTypeError}
                                        helperText={userTypeError ? `${userLabel} Type not Selected !` : ""}
                                        sx={{ backgroundColor: decodedUserId ? '#EEEEEE' : undefined }}
                                    />
                                )}
                            />

                            <FormControl size="small">
                                <Typography sx={{ mb: 1 }}>{eventLabel}*</Typography>
                                {allEvents.map((val) => (
                                    <MenuItem
                                        key={val.id}
                                        value={val.id}
                                        sx={{ p: 0, mt: '-0.8rem' }}
                                        onClick={() => {
                                            setEventError(false)
                                            setSelEvents((prev) =>
                                                prev.includes(Number(val.id))
                                                    ? prev.filter((id) => id !== Number(val.id))
                                                    : [...prev, Number(val.id)]
                                            )
                                        }}
                                    >
                                        <Checkbox checked={selEvents.includes(Number(val.id))} />
                                        <ListItemText primary={val.event_type} />
                                    </MenuItem>
                                ))}
                                {eventError ? <Typography className="selError">{eventLabel} not Selected !</Typography> : null}
                            </FormControl>

                            <Button
                                onClick={() => {
                                    setUserTypeError(false)
                                    setEventError(false)
                                    if (!selUserType || Number(selUserType.id) === 0) {
                                        setUserTypeError(true)
                                        toast.error("Please fix all mandatory fields")
                                        return
                                    }
                                    if (selEvents.length === 0) {
                                        toast.error(`Please Select atleast one ${eventLabel} !`)
                                        setEventError(true)
                                        return
                                    }
                                    setConfirmationDialog(prev => ({
                                        ...prev,
                                        open: true,
                                        title: `${decodedUserId ? "Edit" : "Add"} ${mapLabel}`,
                                        message: !decodedUserId ? `Are you sure ? If Data for ${selUserName} exist, it will be overridden..!` : `Are you sure want to edit this ${mapLabel}`,
                                        confirmText: decodedUserId ? "Update" : "Add",
                                        cancelText: "Cancel",
                                        confirmColor: "primary",
                                        onConfirm: () => handleSubmit()
                                    }))
                                }}
                                variant="contained"
                                sx={{ width: '2rem', textTransform: 'none', mb: 3 }}
                                disabled={
                                    decodedUserId
                                        ? [...selEvents].sort().join(",") === [...hdnSelEvents].sort().join(",")
                                        : false
                                }
                            >
                                {decodedUserId ? "Update" : "Create"}
                            </Button>
                        </Box>
                    )}

                    {tabValue === 1 && (
                        <Box sx={{ p: 0 }}>
                            <DataTable columns={columns} data={eventMapData} loading={loading} />
                        </Box>
                    )}
                </Box>
                <ConfirmationDialog
                    open={confirmationDialog.open}
                    onClose={() => setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))}
                    onConfirm={confirmationDialog.onConfirm}
                    title={confirmationDialog.title}
                    message={confirmationDialog.message}
                    confirmText={confirmationDialog.confirmText}
                    cancelText={confirmationDialog.cancelText}
                    loading={confirmationDialog.loading}
                    confirmColor={confirmationDialog.confirmColor}
                />
            </Box>
        </Layout>
    )
}