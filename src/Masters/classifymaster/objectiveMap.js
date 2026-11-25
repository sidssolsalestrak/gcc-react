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

export default function ObjectiveMap() {

    const { userId } = useParams()
    const decodedUserId = userId !== undefined && userId !== null ? Number(atob(userId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(1)
    const [loading, setLoading] = useState(true)
    const [objMapData, setObjMapData] = useState([])
    const [allUserType, setAllUserType] = useState([])
    const [allObjectives, setAllObjectives] = useState([])
    const [selUserType, setSelUserType] = useState(null)
    const [selUserName, setSelUserName] = useState("")
    const [selObjectives, setSelObjectives] = useState([])
    const [hdnSelObjectives, setHdnSelObjectives] = useState([])
    const [userTypeError, setUserTypeError] = useState(false)
    const [objError, setObjError] = useState(false)

    const [masterPanel, setMasterPanel] = useState({});
    const mapLabel = masterPanel["OMAP"] || "Objective Map"
    const userLabel = masterPanel["USER"] || "User"
    const objLabel = masterPanel["OBJE"] || "Objective"
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
        const fetchObjMapData = async () => {
            setLoading(true)
            try {
                let response = await api.post("/getObjectiveMapData")
                let data = Array.isArray(response.data.data) ? response.data.data : []
                setObjMapData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
            } catch (err) {
                console.log("Fetching objective map data Error", err)
            } finally {
                setLoading(false)
            }
        }
        const fetchInputData = async () => {
            try {
                let response = await api.post("/getObjectiveMapInputData")
                setAllUserType(Array.isArray(response.data.userresdata) ? response.data.userresdata : [])
                setAllObjectives(Array.isArray(response.data.objData) ? response.data.objData : [])
            } catch (err) {
                console.log("fetch Input Data Error", err)
            }
        }
        fetchObjMapData()
        fetchInputData()
    }, [])

    useEffect(() => {
        if (!decodedUserId) {
            setSelObjectives([])
            setHdnSelObjectives([])
            setSelUserType(null)
            setSelUserName("")
            setUserTypeError(false)
            setObjError(false)
            setTabValue(1)
            return
        }
        if (allUserType.length === 0) return
        const collectEditData = async () => {
            try {
                let response = await api.post("/getObjectiveMapEditData", { uid: decodedUserId })
                let data = response.data.data
                const matchedUser = allUserType.find(u => Number(u.id) === Number(data[0].user_type)) || null
                setSelUserType(matchedUser)
                setSelUserName(matchedUser?.client_alias || "")
                let objIds = String(data[0].obj_id || "").split(',').filter(Boolean).map((val) => Number(val))
                setSelObjectives(objIds)
                setHdnSelObjectives(objIds)
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
            let response = await api.post("/objectiveMapCreate", {
                userInputType: selUserType?.id,
                obj_mode: selObjectives.join(",")
            })
            if (response.data.success) {
                toast.success(decodedUserId ? `${mapLabel} Updated successfully` : response.data.message)
                let listRes = await api.post("/getObjectiveMapData")
                let listData = Array.isArray(listRes.data.data) ? listRes.data.data : []
                setObjMapData(listData.map((item, index) => ({ ...item, si_no: index + 1 })))
                if (decodedUserId) {
                    navigate("/masters/objectiveMap")
                } else {
                    setSelObjectives([])
                    setHdnSelObjectives([])
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
            let response = await api.post("/deleteObjectiveMap", { uid: userId })
            if (response.data.success) {
                toast.success("Deleted Successfully")
                let listRes = await api.post("/getObjectiveMapData")
                let listData = Array.isArray(listRes.data.data) ? listRes.data.data : []
                setObjMapData(listData.map((item, index) => ({ ...item, si_no: index + 1 })))
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
                        navigate(`/masters/objectiveMap/${btoa(row.row.user_type)}`)
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
                { label: "Master", path: '/masters/objectiveMap' },
                { label: "Admin Panel", path: '/masters/objectiveMap' },
                { label: mapLabel, path: '/masters/objectiveMap' },
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
                                <Typography sx={{ mb: 1 }}>{objLabel}*</Typography>
                                {allObjectives.map((val) => (
                                    <MenuItem
                                        key={val.id}
                                        value={val.id}
                                        sx={{ p: 0, mt: '-0.8rem' }}
                                        onClick={() => {
                                            setObjError(false)
                                            setSelObjectives((prev) =>
                                                prev.includes(Number(val.id))
                                                    ? prev.filter((id) => id !== Number(val.id))
                                                    : [...prev, Number(val.id)]
                                            )
                                        }}
                                    >
                                        <Checkbox checked={selObjectives.includes(Number(val.id))} />
                                        <ListItemText primary={val.call_obj} />
                                    </MenuItem>
                                ))}
                                {objError ? <Typography className="selError">{objLabel} not Selected !</Typography> : null}
                            </FormControl>

                            <Button
                                onClick={() => {
                                    setUserTypeError(false)
                                    setObjError(false)
                                    if (!selUserType || Number(selUserType.id) === 0) {
                                        setUserTypeError(true)
                                        toast.error("Please fix all mandatory fields")
                                        return
                                    }
                                    if (selObjectives.length === 0) {
                                        toast.error(`Please Select atleast one ${objLabel} !`)
                                        setObjError(true)
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
                                        ? [...selObjectives].sort().join(",") === [...hdnSelObjectives].sort().join(",")
                                        : false
                                }
                            >
                                {decodedUserId ? "Update" : "Create"}
                            </Button>
                        </Box>
                    )}

                    {tabValue === 1 && (
                        <Box sx={{ p: 0 }}>
                            <DataTable columns={columns} data={objMapData} loading={loading} />
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