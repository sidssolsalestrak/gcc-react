import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab,
    IconButton, Autocomplete
} from "@mui/material";
import api from "../../services/api";
import { useSnackbar } from "notistack";
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

export default function Beat() {

    const { editBeatId } = useParams()
    const decodedEditBeatId = editBeatId !== undefined && editBeatId !== null ? Number(atob(editBeatId)) : null
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    const [tabValue, setTabValue] = useState(1)
    const [selTerritory, setSelTerritory] = useState("0")
    const [selArea, setSelArea] = useState("0")
    const [hdnSelTerritory, setHdnSelTerritory] = useState("0")
    const [hdnSelArea, setHdnSelArea] = useState("0")
    const [beatName, setBeatName] = useState("")
    const [hdnBeatName, setHdnBeatName] = useState("")
    const [allTerritory, setAllTerritory] = useState([])
    const [allBeatData, setAllBeatData] = useState([])
    const [allArea, setAllArea] = useState([])
    const [regId, setRegId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [territoryError, setTerritoryError] = useState(false)
    const [areaError, setAreaError] = useState(false)
    const [beatError, setBeatError] = useState(false)
    const [beatErrorMsg, setBeatErrorMsg] = useState("")
    const [accStat, setAccStat] = useState(null)
    const [isAreaChanged, setIsAreaChanged] = useState(false)
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const location = useLocation()
    const [masterPanel, setMasterPanel] = useState({});

    const beatLabel = masterPanel["BEAT"] || "Beat";
    const areaLabel = masterPanel["AREA"] || "Area";
    const territoryLabel = masterPanel["TERR"] || "Territory";
    usePageTitle(beatLabel || "Beat")

    const DEFAULT_AREA = { id: "0", area_name: `Select  ${areaLabel}` }
    const DEFAULT_TERRITORY = { id: "0", ter_name: `Select ${territoryLabel}` }

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllBeat()
    }, [])

    useEffect(() => {
        fetchAllArea()
        // eslint-disable-next-line
    }, [regId])

    useEffect(() => {
        if (!isAreaChanged) return
        fetchAllTerritory(Number(selArea) !== 0 ? selArea : null)
        // eslint-disable-next-line
    }, [selArea])

    useEffect(() => {
        if (!decodedEditBeatId) {
            resetFields()
            setTabValue(1)
            return
        }
        if (allArea.length === 0) return
        collectEditData(decodedEditBeatId)
        // eslint-disable-next-line
    }, [decodedEditBeatId, allArea])

    const resetFields = () => {
        setSelTerritory("0")
        setBeatName("")
        setRegId(null)
        setSelArea("0")
        setHdnSelTerritory("0")
        setHdnSelArea("0")
        setHdnBeatName("")
        setAllTerritory([])
        setIsAreaChanged(false)
        setTerritoryError(false)
        setAreaError(false)
        setBeatError(false)
        setBeatErrorMsg("")
    }

    const fetchAllBeat = async () => {
        try {
            let response = await api.post("/readBeat", { beat_id: null, ter_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllBeatData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
            setAccStat(response?.data?.acc_stat?? null);
            if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", response?.data?.acc_stat);
            }
        } catch (err) {
            console.log("fetchAllBeat error", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchAllTerritory = async (area_id) => {
        try {
            let response = await api.post("/getTerriTb", { ter_id: null, area_id: area_id })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllTerritory(data)
            setSelTerritory(data.length > 0 ? data[0].id : "0")
        } catch (err) {
            console.log("fetchAllTerritory error", err)
        }
    }

    const fetchAllArea = async () => {
        try {
            let response = await api.post("/getAreatb", { area_id: null, reg_id: regId })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllArea(data)
        } catch (err) {
            console.log("fetchAllArea error", err)
        }
    }

    const fetchTerritoriesForEdit = async (area_id) => {
        console.log("area id passing interritory",area_id)
        try {
            let response = await api.post("/getTerriTb", { ter_id: null, area_id: area_id })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllTerritory(data)
        } catch (err) {
            console.log("fetchTerritoriesForEdit error", err)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readBeat", { beat_id: id })
            let data = response.data.data[0]
            setRegId(data.reg_id)
            setSelArea(data.areaId)
            setHdnSelArea(data.areaId)
            setBeatName(data.beat_name)
            setHdnBeatName(data.beat_name)
            setTerritoryError(false)
            setAreaError(false)
            setBeatError(false)
            setBeatErrorMsg("")
            setTabValue(0)
            await fetchTerritoriesForEdit(data.areaId)
            setSelTerritory(data.ter_id)
            setHdnSelTerritory(data.ter_id)
            setIsAreaChanged(false)
            setAccStat(response?.data?.acc_stat?? null);
            if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", response?.data?.acc_stat);
            }
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateBeatFields = () => {
        let isValid = true
        setTerritoryError(false)
        setAreaError(false)
        setBeatError(false)
        setBeatErrorMsg("")

        if (Number(selArea) === 0 || !selArea) { setAreaError(true); isValid = false }

        if (Number(selTerritory) === 0) { setTerritoryError(true); isValid = false }

        if (!beatName || beatName.trim() === "") {
            setBeatError(true)
            setBeatErrorMsg(`The ${beatLabel} Name field is required.`)
            isValid = false
        }  else if (/[^a-zA-Z0-9_\-\/ ]/.test(beatName)) {
            setBeatError(true)
            setBeatErrorMsg("Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed")
            isValid = false
        }

        if (!isValid) {
            enqueueSnackbar("Please fix all mandatory fields", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        }
        return isValid
    }

    const handleSubmit = async () => {
        try {
            setModifyLoading(true)
            if (decodedEditBeatId) {
                let check = hdnBeatName.toLowerCase().trim() === beatName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/beatUpdate", {
                    id: decodedEditBeatId,
                    beat_name: beatName.trim(),
                    ter_id: selTerritory,
                    check: check
                })
                if (response.data.success) {
                    enqueueSnackbar(response.data.message, { variant: "success", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                    fetchAllBeat()
                    navigate('/masters/beat_mas')
                } else {
                    enqueueSnackbar(response.data.message || "Update Failed", { variant: "error", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                }
            } else {
                let response = await api.post("/beatCreate", {
                    beat_name: beatName.trim(),
                    ter_id: selTerritory
                })
                if (response.data.success) {
                    enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                    resetFields()
                    fetchAllBeat()
                    setTabValue(1)
                } else {
                    enqueueSnackbar(response.data.message, { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                }
            }
        } catch (err) {
            console.log(err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        } finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    }

    const handleEdit = (id) => {
        navigate(`/masters/beat_mas/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteBeat", { id })
            if (response.data.code === 1) {
                enqueueSnackbar(response.data.message, { variant: "success", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            } else {
                enqueueSnackbar(response.data.message, { variant: "error", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            }
            fetchAllBeat()
        } catch (err) {
            console.log("deleteBeat error", err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
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
            title: `${decodedEditBeatId ? "Edit" : "Add"} ${beatLabel}`,
            message: `Are you sure you want to ${decodedEditBeatId ? "Edit" : "Add"} this ${beatLabel}?`,
            confirmText: decodedEditBeatId ? "Update" : "Add",
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

    const areaOptions = decodedEditBeatId
        ? allArea
        : [DEFAULT_AREA, ...allArea]

    const territoryOptions = [DEFAULT_TERRITORY, ...allTerritory]

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "area_name", headerName:`${areaLabel}`,filterable: true, sortable: true},
        { field: "ter_name", headerName: `${territoryLabel} Name`, filterable: true, sortable: true },
        { field: "beat_name", headerName: `${beatLabel} Name`, filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.id)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>}
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.id)}>
                            <DeleteIcon size={15} />
                        </IconButton>}
                </>
            )
        }
    ]

    console.log("sel Area passing",selArea)

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Master", path: "/masters/beat_mas" },
                { label: " Geographical", path: "/masters/beat_mas" },
                { label: beatLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{beatLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditBeatId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {beatLabel} Details</Typography>
                    }
                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <Autocomplete
                                options={areaOptions}
                                getOptionLabel={(option) => option.area_name || ""}
                                value={areaOptions.find((a) => a.id === selArea)}
                                onChange={(e, newVal) => {
                                    const id = newVal ? newVal.id : ""
                                    setSelArea(id)
                                    setIsAreaChanged(true)
                                    if (areaError) setAreaError(false)
                                }}
                                disableClearable={!!decodedEditBeatId}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        required
                                        {...params}
                                        label={`${areaLabel}`}
                                        size="small"
                                        error={areaError}
                                        helperText={areaError ? `The ${areaLabel} Name field is required.` : ""}
                                    />
                                )}
                            />
                            <Autocomplete
                                options={territoryOptions}
                                getOptionLabel={(option) => option.ter_name || ""}
                                value={territoryOptions.find((t) => t.id === selTerritory)}
                                onChange={(e, newVal) => {
                                    setSelTerritory(newVal ? newVal.id : "")
                                    if (territoryError) setTerritoryError(false)
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`${territoryLabel}`}
                                        size="small"
                                        error={territoryError}
                                        required
                                        helperText={territoryError ? `The ${territoryLabel} Name field is required.` : ""}
                                    />
                                )}
                            />
                            <TextField
                                label={`${beatLabel} Name`}
                                size="small"
                                value={beatName}
                                onChange={(e) => {
                                    const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                    setBeatName(onlyText)
                                    if (beatError) { setBeatError(false); setBeatErrorMsg("") }
                                }}
                                error={!!beatError}
                                required
                                helperText={beatError ? beatErrorMsg : ""}
                            />
                            {!decodedEditBeatId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateBeatFields()) showSubmitConfirmation() }}
                                >
                                   Create
                                </Button>
                            }
                            {decodedEditBeatId && [0, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    disabled={
                                        String(hdnSelTerritory) === String(selTerritory) &&
                                        hdnBeatName.toLowerCase().trim() === beatName.toLowerCase().trim()
                                    }
                                    onClick={() => { if (validateBeatFields()) showSubmitConfirmation() }}
                                >
                                   Update
                                </Button>}
                        </Box>
                    )}
                    {tabValue === 1 && (
                        <Box sx={{ p: 0 }}>
                            <DataTable columns={columns} data={allBeatData} loading={loading} />
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