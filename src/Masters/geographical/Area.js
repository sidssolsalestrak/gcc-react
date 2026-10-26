import { useState, useEffect } from "react";
import Layout from "../../layout";
import { TextField, Box, Typography, Button, Tabs, Tab, IconButton, Autocomplete } from "@mui/material";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import PageHeader from "../../utils/PageHeader";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../../utils/confirmDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import { MdOutlineEdit } from "react-icons/md";
import { getMasterPanel } from "../../services/masterPanelService";
import usePageTitle from '../../services/usePageTitle'

export default function Area() {

    const { editAreaId } = useParams()
    const decodedAreaId = editAreaId !== undefined && editAreaId !== null ? Number(atob(editAreaId)) : null
    const toast = useToast()
    const navigate = useNavigate()

    const [tabValue, setTabValue] = useState(1)
    const [selRegion, setSelRegion] = useState(null)
    const [selState, setSelState] = useState(null)
    const [hdnSelRegionId, setHdnSelRegionId] = useState(null)
    const [hdnSelStateId, setHdnSelStateId] = useState(null)
    const [areaName, setAreaName] = useState("")
    const [hdnAreaName, setHdnAreaName] = useState("")
    const [allRegion, setAllRegion] = useState([])
    const [allState, setAllState] = useState([])
    const [allArea, setAllArea] = useState([])
    const [accStat, setAccStat] = useState(null)
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [regionError, setRegionError] = useState(false)
    const [stateError, setStateError] = useState(false)
    const [areaError, setAreaError] = useState(false)
    const [areaErrorMsg, setAreaErrorMsg] = useState("")
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const location = useLocation()
    const [masterPanel, setMasterPanel] = useState({});

    const areaLabel = masterPanel["AREA"] || "Area";
    const regionLabel = masterPanel["REGN"] || "Region";
    const stateLabel = "State";
     usePageTitle(areaLabel || "Area")

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchArea()
        fetchRegion()
        fetchState()
    }, [])

    useEffect(() => {
        if (!decodedAreaId) {
            resetFields()
            setTabValue(1)
            return
        }
        if (allRegion.length === 0 || allState.length === 0) return
        collectEditData(decodedAreaId)
        // eslint-disable-next-line
    }, [decodedAreaId, allRegion, allState])

    const resetFields = () => {
        setSelRegion(null)
        setSelState(null)
        setHdnSelRegionId(null)
        setHdnSelStateId(null)
        setAreaName("")
        setHdnAreaName("")
        setRegionError(false)
        setStateError(false)
        setAreaError(false)
        setAreaErrorMsg("")
    }

    const fetchArea = async () => {
        try {
            let response = await api.post("/read_area", { areaId: null, regId: null })
            let areaData = Array.isArray(response.data.data) ? response.data.data : []
            setAllArea(areaData.map((item, index) => ({ ...item, si_no: index + 1 })))
            setAccStat(response?.data?.acc_stat?? null);
            if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", response?.data?.acc_stat);
            }
        } catch (err) {
            console.log("fetchArea error", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchRegion = async () => {
        try {
            let response = await api.post("/getRegionList", { zone_id: null })
            setAllRegion(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("fetchRegion error", err)
        }
    }

    const fetchState = async () => {
        try {
            let response = await api.post("/getState")
            setAllState(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("fetchState error", err)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/read_area", { areaId: id })
            let data = response.data.data[0]

            const matchedRegion = allRegion.find(r => r.id === data.reg_id) || null
            const matchedState = allState.find(s => s.id === data.state_id) || null
            setSelRegion(matchedRegion)
            setSelState(matchedState)
            setHdnSelRegionId(matchedRegion?.id ?? null)
            setHdnSelStateId(matchedState?.id ?? null)

            setAreaName(data.area_name)
            setHdnAreaName(data.area_name)
            setRegionError(false)
            setStateError(false)
            setAreaError(false)
            setAreaErrorMsg("")
            setTabValue(0)
            setAccStat(response?.data?.acc_stat?? null);
            if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", response?.data?.acc_stat);
            }
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateAreaFields = () => {
        let isValid = true
        setRegionError(false)
        setStateError(false)
        setAreaError(false)
        setAreaErrorMsg("")

        if (!selRegion || Number(selRegion.id) === 0) { setRegionError(true); isValid = false }
        if (!selState || Number(selState.id) === 0) { setStateError(true); isValid = false }

        if (!areaName || areaName.trim() === "") {
            setAreaError(true)
            setAreaErrorMsg(`The ${areaLabel} Name field is required.`)
            isValid = false
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(areaName)) {
            setAreaError(true)
            setAreaErrorMsg("Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed")
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
            if (decodedAreaId) {
                let check = 1
                if (hdnAreaName.toLowerCase().trim() === areaName.toLowerCase().trim()) check = 0
                let response = await api.post("/areaUpdate", {
                    updId: decodedAreaId,
                    reg_name: selRegion?.id,
                    state_name: selState?.id,
                    area_name: areaName.trim(),
                    check: check
                })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchArea()
                    navigate('/masters/area_mas')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/areaCreate", {
                    reg_name: selRegion?.id,
                    state_name: selState?.id,
                    area_name: areaName.trim()
                })
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchArea()
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

    const handleEdit = (editAreaId) => {
        navigate(`/masters/area_mas/${btoa(editAreaId)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteArea", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchArea()
        } catch (err) {
            console.log("deleteArea error", err)
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
        setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))
    }

    const showSubmitConfirmation = () => {
        showConfirmationDialog({
            title: `${decodedAreaId ? "Edit" : "Add"} ${areaLabel}`,
            message: `Are you sure you want to ${decodedAreaId ? "Edit" : "Add"} this ${areaLabel}?`,
            confirmText: decodedAreaId ? "Update" : "Add",
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

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "reg_name", headerName: regionLabel.toUpperCase(), filterable: true, sortable: true },
        { field: "area_name", headerName: areaLabel.toUpperCase(), filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.id)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>
                    }
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.id)}>
                            <DeleteIcon size={15} />
                        </IconButton>
                    }
                </>
            )
        }
    ]

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Master", path: "/masters/area_mas/" },
                { label: " Geographical", path: "/masters/area_mas/" },
                { label: areaLabel, path: location.pathname },
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
                    <h1 className="mainTitle">{areaLabel}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedAreaId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {areaLabel} Details</Typography>
                    }
                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>

                            <Autocomplete
                                options={[{ id: "0", reg_name: `Select ${regionLabel}` }, ...allRegion]}
                                getOptionLabel={(option) => option.reg_name || ""}
                                value={selRegion}
                                onChange={(e, newValue) => {
                                    setSelRegion(newValue)
                                    if (regionError) setRegionError(false)
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`${regionLabel}`}
                                        size="small"
                                        error={regionError}
                                        required
                                        helperText={regionError ? `The ${regionLabel} Name field is required.` : ""}
                                    />
                                )}
                            />
                            <TextField label={`${areaLabel}`} size="small" value={areaName}
                                onChange={(e) => {
                                    const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                    setAreaName(onlyText)
                                    if (areaError) { setAreaError(false); setAreaErrorMsg("") }
                                }}
                                error={!!areaError}
                                required
                                helperText={areaError ? areaErrorMsg : ""}
                            />
                            {(!decodedAreaId && [0, 1, 2].includes(Number(accStat))) &&
                                <Button variant="contained" sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateAreaFields()) showSubmitConfirmation() }}>
                                    {decodedAreaId ? "Update" : "Create"}
                                </Button>}
                            {(decodedAreaId && [0, 2].includes(Number(accStat))) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    disabled={
                                        String(hdnSelRegionId) === String(selRegion?.id) &&
                                        String(hdnSelStateId) === String(selState?.id) &&
                                        hdnAreaName.toLowerCase().trim() === areaName.toLowerCase().trim()
                                    }
                                    onClick={() => { if (validateAreaFields()) showSubmitConfirmation() }}>
                                    Update
                                </Button>
                            }
                        </Box>
                    )}
                    {tabValue === 1 && (
                        <Box sx={{ p: 0 }}>
                            <DataTable columns={columns} data={allArea} loading={loading} />
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