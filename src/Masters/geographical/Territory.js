import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab,
    IconButton, Autocomplete
} from "@mui/material";
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

export default function Territory() {

    const { editTeritoryId } = useParams()
    const decodedEditTerritoryId = editTeritoryId !== undefined && editTeritoryId !== null ? Number(atob(editTeritoryId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const [accStat, setAccStat] = useState(null)
    const [tabValue, setTabValue] = useState(1)
    const [selArea, setSelArea] = useState(null)
    const [hdnSelAreaId, setHdnSelAreaId] = useState(null)
    const [terName, setTerName] = useState("")
    const [hdnTerName, setHdnTerName] = useState("")
    const [allArea, setAllArea] = useState([])
    const [allTerData, setAllTerData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [areaError, setAreaError] = useState(false)
    const [terError, setTerError] = useState(false)
    const [terErrorMsg, setTerErrorMsg] = useState("")
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const location = useLocation()
    const [masterPanel, setMasterPanel] = useState({});

    const territoryLabel = masterPanel["TERR"] || "Territory";
    const areaLabel = masterPanel["AREA"] || "Area";
    usePageTitle(territoryLabel)

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllTerritory()
        fetchAllArea()
    }, [])

    useEffect(() => {
        if (!decodedEditTerritoryId || allArea.length === 0) {
            resetFields()
            setTabValue(1)
            return
        }
        if (allArea.length === 0) return
        collectEditData(decodedEditTerritoryId)
        // eslint-disable-next-line
    }, [decodedEditTerritoryId, allArea])

    const resetFields = () => {
        setSelArea(null)
        setHdnSelAreaId(null)
        setTerName("")
        setHdnTerName("")
        setAreaError(false)
        setTerError(false)
        setTerErrorMsg("")
    }

    const fetchAllTerritory = async () => {
        try {
            let response = await api.post("/readTerritory", { ter_id: null, area_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllTerData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
            setAccStat(response?.data?.acc_stat?? null);
            if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", response?.data?.acc_stat);
            }
        } catch (err) {
            console.log("fetchAllTerritory error", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchAllArea = async () => {
        try {
            let response = await api.post("/areaList", { area_id: null, regId: null })
            let areaData = Array.isArray(response.data.data) ? response.data.data : []
            setAllArea(areaData)
        } catch (err) {
            console.log("fetchAllArea error", err)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readTerritory", { ter_id: id, area_id: null })
            let data = response.data.data[0]
            const selectedArea = allArea.find(area => area.id === data.area_id)
            setSelArea(selectedArea || null)
            setHdnSelAreaId(selectedArea?.id ?? null)
            setTerName(data.ter_name)
            setHdnTerName(data.ter_name)
            setAreaError(false)
            setTerError(false)
            setTerErrorMsg("")
            setTabValue(0)
            setAccStat(response?.data?.acc_stat)
            if(response?.data?.acc_stat){
                localStorage.setItem("acc_stat", response?.data?.acc_stat);
            }
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateTerritoryFields = () => {
        let isValid = true
        setAreaError(false)
        setTerError(false)
        setTerErrorMsg("")

        if (!selArea || Number(selArea.id) === 0) { setAreaError(true); isValid = false }

        if (!terName || terName.trim() === "") {
            setTerError(true)
            setTerErrorMsg(`The ${territoryLabel} Name field is required.`)
            isValid = false
        }  else if (/[^a-zA-Z0-9_\-\/ ]/.test(terName)) {
            setTerError(true)
            setTerErrorMsg("Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed")
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
            if (decodedEditTerritoryId) {
                let check = hdnTerName.toLowerCase().trim() === terName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/terMasUpdate", {
                    id: decodedEditTerritoryId,
                    ter_name: terName.trim(),
                    area_id: selArea?.id,
                    check: check
                })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllTerritory()
                    navigate('/masters/ter_mas')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/terMasCreate", {
                    ter_name: terName.trim(),
                    areaId: selArea?.id
                })
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllTerritory()
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
        navigate(`/masters/ter_mas/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteTerritory", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllTerritory()
        } catch (err) {
            console.log("deleteTerritory error", err)
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
            title: `${decodedEditTerritoryId ? "Edit" : "Add"} ${territoryLabel}`,
            message: `Are you sure you want to ${decodedEditTerritoryId ? "Edit" : "Add"} this ${territoryLabel}?`,
            confirmText: decodedEditTerritoryId ? "Update" : "Add",
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
        { field: "area", headerName: `${areaLabel}`, filterable: true, sortable: true },
        { field: "ter_name", headerName: territoryLabel.toUpperCase(), filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    { [0,2].includes(Number(accStat)) &&
                    <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.id)}>
                        <MdOutlineEdit size={15} />
                    </IconButton>}
                    { [0,2].includes(Number(accStat)) &&
                    <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.id)}>
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
                { label: "Master", path: "/masters/ter_mas" },
                { label: " Geographical", path: "/masters/ter_mas" },
                { label: territoryLabel, path: location.pathname },
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
                    <h1 className="mainTitle">{territoryLabel}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditTerritoryId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {territoryLabel} Details</Typography>
                    }
                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <Autocomplete
                                options={[{ id: "0", area_name: `Select ${areaLabel}` }, ...allArea]}
                                getOptionLabel={(option) => option.area_name}
                                value={selArea}
                                onChange={(event, newValue) => {
                                    setSelArea(newValue)
                                    if (areaError) setAreaError(false)
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`${areaLabel}`}
                                        size="small"
                                        error={areaError}
                                        required
                                        helperText={areaError ? `The ${areaLabel} Name field is required.` : ""}
                                    />
                                )}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                            />
                            <TextField label={`${territoryLabel}`} size="small" value={terName}
                                onChange={(e) => {
                                    const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                    setTerName(onlyText)
                                    if (terError) { setTerError(false); setTerErrorMsg("") }
                                }}
                                error={!!terError}
                                required
                                helperText={terError ? terErrorMsg : ""}
                                placeholder="Enter Territory name"
                            />
                            {!decodedEditTerritoryId && [0,1,2].includes(Number(accStat)) &&
                             <Button variant="contained" sx={{ width: '2rem', textTransform: 'none' }}
                                onClick={() => { if (validateTerritoryFields()) showSubmitConfirmation() }}>
                                Create
                            </Button>
                            }
                            {decodedEditTerritoryId && [0,2].includes(Number(accStat)) &&
                            <Button
                                variant="contained"
                                sx={{ width: '2rem', textTransform: 'none' }}
                                disabled={
                                    String(hdnSelAreaId) === String(selArea?.id) &&
                                    hdnTerName.toLowerCase().trim() === terName.toLowerCase().trim()
                                }
                                onClick={() => { if (validateTerritoryFields()) showSubmitConfirmation() }}>
                              Update
                            </Button>
                            }
                        </Box>
                    )}
                    {tabValue === 1 && (
                        <Box sx={{ p: 0 }}>
                            <DataTable columns={columns} data={allTerData} loading={loading} />
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