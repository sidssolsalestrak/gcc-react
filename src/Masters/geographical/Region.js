import { useState, useEffect } from "react";
import Layout from "../../layout";
import { TextField, Box, Typography, Button, Tabs, Tab, IconButton, Select, InputLabel, MenuItem, FormControl } from "@mui/material";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import PageHeader from "../../utils/PageHeader";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import DataTable from "../../utils/dataTable";
import ConfirmationDialog from "../../utils/confirmDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import { MdOutlineEdit } from "react-icons/md";
import { getMasterPanel } from "../../services/masterPanelService";
import usePageTitle from '../../services/usePageTitle'

export default function Region() {

    const navigate = useNavigate()
    const toast = useToast()
    const { editRegionId } = useParams()
    const decodedEditRegionId = editRegionId !== undefined && editRegionId !== null ? Number(atob(editRegionId)) : null

    const [tabValue, setTabValue] = useState(1)
    const [zoneName, setZoneName] = useState([])
    const [selectedZone, setSelectedZone] = useState("0")
    const [hdnZoneId, setHdnZoneId] = useState("0")
    const [regData, setRegData] = useState([])
    const [regionName, setRegionName] = useState("")
    const [hdnRegionName, setHdnRegionName] = useState("")
    const [editId, setEditId] = useState(null)
    const [zoneError, setZoneError] = useState(false)
    const [zoneErrMsg, setZoneErrMsg] = useState("")
    const [regionError, setRegionError] = useState(false)
    const [regionErrMsg, setRegionErrMsg] = useState("")
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)
    const location = useLocation()

    const [masterPanel, setMasterPanel] = useState({});
    usePageTitle(masterPanel["REGN"] || "Region")

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    useEffect(() => {
        fetchZoneNames()
        fetchRegData()
    }, [])

    useEffect(() => {
        if (!decodedEditRegionId) {
            setRegionName("")
            setSelectedZone("0")
            setHdnRegionName("")
            setHdnZoneId("0")
            setZoneError(false)
            setRegionError(false)
            setEditId(null)
            setTabValue(1)
            return
        }
        collectEditData(decodedEditRegionId)
    }, [decodedEditRegionId])

    const fetchZoneNames = async () => {
        try {
            let response = await api.get("/zoneNames")
            setZoneName(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("Zone name Error", err)
        }
    }

    const fetchRegData = async () => {
        try {
            let response = await api.post("/regionData", { reg_id: 0 })
            let regsdata = Array.isArray(response.data.regTabResData) ? response.data.regTabResData : []
            setRegData(regsdata.map((item, index) => ({ ...item, si_no: index + 1 })))
            setAccStat(response?.data?.acc_stat?? null);
            if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", response?.data?.acc_stat);
            }
        } catch (err) {
            console.log("fetch Data Error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (regId) => {
        try {
            let response = await api.post("/regionData", { reg_id: regId })
            let data = response.data.regIdres[0]
            setEditId(regId)
            setSelectedZone(data.zone_id)
            setHdnZoneId(data.zone_id)
            setRegionName(data.reg_name)
            setHdnRegionName(data.reg_name)
            setZoneError(false)
            setRegionError(false)
            setRegionErrMsg("")
            setTabValue(0)
            setAccStat(response?.data?.acc_stat?? null);
            if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", response?.data?.acc_stat);
            }
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateRegion = () => {
        let isValid = true
        const regLabel = masterPanel["REGN"] || "Region"
        const zoneLabel = masterPanel["ZONE"] || "Zone"
        setZoneError(false); setZoneErrMsg("")
        setRegionError(false); setRegionErrMsg("")

        if (Number(selectedZone) === 0) {
            setZoneError(true)
            setZoneErrMsg(`${zoneLabel} name is required`)
            isValid = false
        }

        if (!regionName || regionName.trim() === "") {
            setRegionError(true)
            setRegionErrMsg(`The ${regLabel} Name field is required`)
            isValid = false
        } else if (regionName.trim().length < 3) {
            setRegionError(true)
            setRegionErrMsg(`${regLabel} Name must be at least 3 characters`)
            isValid = false
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(regionName)) {
            setRegionError(true)
            setRegionErrMsg("Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed")
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
            if (decodedEditRegionId) {
                let check = hdnRegionName.toLowerCase().trim() === regionName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/regionUpdate", { id: editId, zone_id: selectedZone, regName: regionName.trim(), check: check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchRegData()
                    navigate('/masters/region')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/regionCreate", { zone_id: selectedZone, regName: regionName.trim() })
                if (response.data.success) {
                    toast.success(`${masterPanel["REGN"] || "Region"} added successfully`)
                    setSelectedZone("0")
                    setRegionName("")
                    fetchRegData()
                    setTabValue(1)
                } else {
                    toast.error(response.data.message || "Insert Failed")
                }
            }
        } catch (err) {
            toast.error("Something went wrong !!")
        } finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    }

    const handleEdit = (regId) => {
        navigate(`/masters/region/${btoa(regId)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/regionDelete", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchRegData()
        } catch (err) {
            toast.error("Something went wrong try again!!")
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
        const label = masterPanel["REGN"] || "Region"
        showConfirmationDialog({
            title: `${decodedEditRegionId ? "Edit" : "Add"} ${label}`,
            message: `Are you sure you want to ${decodedEditRegionId ? "Edit" : "Add"} this ${label}?`,
            confirmText: decodedEditRegionId ? "Update" : "Add",
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
        { field: "reg_name", headerName: `${(masterPanel["REGN"] || "Region").toUpperCase()} NAME`, filterable: true, sortable: true },
        { field: "zone_name", headerName: `${(masterPanel["ZONE"] || "ZONE").toUpperCase()} NAME`, filterable: true, sortable: true },
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
                { label: "Master", path: "/masters/region" },
                { label: " Geographical", path: "/masters/region" },
                { label: masterPanel["REGN"] ? `${masterPanel["REGN"]}` : "Region", path: location.pathname },
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
                    <h1 className="mainTitle">{masterPanel["REGN"] || "Region"}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditRegionId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {masterPanel["REGN"] || "Region"} Details</Typography>}

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <FormControl sx={{ width: '100%' }}>
                                <InputLabel id="zone_name">{masterPanel["ZONE"] || "Zone"}*</InputLabel>
                                <Select
                                    value={selectedZone}
                                    onChange={(e) => setSelectedZone(e.target.value)}
                                    labelId="zone_name"
                                    label={`${masterPanel["ZONE"] || "Zone"}*`}
                                    size="small"
                                    error={zoneError}
                                    MenuProps={{
                                        PaperProps: {
                                            style: {
                                                maxHeight: 200
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value="0">Select {masterPanel["ZONE"] || "Zone"}</MenuItem>
                                    {zoneName.map((val) => (
                                        <MenuItem key={val.id} value={val.id}>{val.zone_name}</MenuItem>
                                    ))}
                                </Select>
                                {zoneError && <Typography sx={{ fontSize: '9px', color: '#D32F2F', ml: 1.7 }}>{zoneErrMsg}</Typography>}
                            </FormControl>

                            <TextField
                                label={`${masterPanel["REGN"] || "Region"} `}
                                placeholder={`Enter ${masterPanel["REGN"] || "Region"} Name`}
                                size="small"
                                value={regionName}
                                error={!!regionError}
                                helperText={regionErrMsg || ""}
                                required
                                onChange={(e) => {
                                    const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                    setRegionName(onlyText)
                                    if (regionError) { setRegionError(false); setRegionErrMsg("") }
                                }}
                            />

                            {(!decodedEditRegionId && [0, 1, 2].includes(Number(accStat))) && (<Button variant="contained" sx={{ width: '2rem', textTransform: 'none' }}
                                onClick={() => { if (validateRegion()) showSubmitConfirmation() }}>
                                Create
                            </Button>)
                            }
                            {(decodedEditRegionId && [0, 2].includes(Number(accStat))) && (
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    disabled={
                                        String(hdnZoneId) === String(selectedZone) &&
                                        hdnRegionName.toLowerCase().trim() === regionName.toLowerCase().trim()
                                    }
                                    onClick={() => { if (validateRegion()) showSubmitConfirmation() }}>
                                    Update
                                </Button>
                            )
                            }
                        </Box>
                    )}

                    {tabValue === 1 && (
                        <Box sx={{ p: 0 }}>
                            <DataTable columns={columns} data={regData} loading={loading} />
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