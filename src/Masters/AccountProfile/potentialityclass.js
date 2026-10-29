import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab,
    IconButton
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

export default function Potentialityclass() {

    const { editPotId } = useParams()
    const decodedEditPotId = editPotId !== undefined && editPotId !== null ? Number(atob(editPotId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [potName, setPotName] = useState("")
    const [hdnPotName, setHdnPotName] = useState("")
    const [potDesc, setPotDesc] = useState("")
    const [hdnPotDesc, setHdnPotDesc] = useState("")

    const [allPotData, setAllPotData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [potError, setPotError] = useState(false)
    const [potErrorMsg, setPotErrorMsg] = useState("")
    const [descError, setDescError] = useState(false)
    const [descErrorMsg, setDescErrorMsg] = useState("")

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const potLabel = masterPanel["POTE"] || "Potentiality Type";
    usePageTitle(potLabel || "Potentiality Type")

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllPotential()
    }, [])

    useEffect(() => {
        if (!decodedEditPotId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditPotId)
        // eslint-disable-next-line
    }, [decodedEditPotId])

    const resetFields = () => {
        setPotName(""); setHdnPotName("")
        setPotDesc(""); setHdnPotDesc("")
        setPotError(false); setPotErrorMsg("")
        setDescError(false); setDescErrorMsg("")
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchAllPotential = async () => {
        try {
            let response = await api.post("/readPotential", { id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllPotData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllPotential error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readPotential", { id: id })
            let data = response.data.data[0]
            setPotName(data.cat_type || "")
            setHdnPotName(data.cat_type || "")
            setPotDesc(data.cat_desc || "")
            setHdnPotDesc(data.cat_desc || "")
            setPotError(false); setPotErrorMsg("")
            setDescError(false); setDescErrorMsg("")
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        let isValid = true
        setPotError(false); setPotErrorMsg("")
        setDescError(false); setDescErrorMsg("")

        if (!potName || potName.trim() === "") {
            setPotError(true)
            setPotErrorMsg(`The type field is required.`)
            isValid = false
        }

        if (!potDesc || potDesc.trim() === "") {
            setDescError(true)
            setDescErrorMsg("The Description field is required.")
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
                cat_type: potName.trim(),
                cat_desc: potDesc.trim()
            }

            if (decodedEditPotId) {
                let check = hdnPotName.toLowerCase().trim() === potName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/potentialUpdate", { id: decodedEditPotId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllPotential()
                    navigate('/masters/potential')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/potentialCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllPotential()
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
        navigate(`/masters/potential/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deletePotential", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllPotential()
        } catch (err) {
            console.log("deletePotential error", err)
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
            title: `${decodedEditPotId ? "Edit" : "Add"} ${potLabel}`,
            message: `Are you sure you want to ${decodedEditPotId ? "Edit" : "Add"} this ${potLabel}?`,
            confirmText: decodedEditPotId ? "Update" : "Add",
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
        hdnPotName.toLowerCase().trim() === potName.toLowerCase().trim() &&
        hdnPotDesc.trim() === potDesc.trim()

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "cat_type", headerName: "Type", filterable: true, sortable: true },
        { field: "cat_desc", headerName: "Description", filterable: true, sortable: true },
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

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Master", path: "/masters/potential" },
                { label: potLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{potLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditPotId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {potLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <TextField
                                label="Category Type"
                                size="small"
                                placeholder="Enter Category"
                                value={potName}
                                onChange={(e) => {
                                    setPotName(e.target.value.replace(/^\s+/, ""))
                                    if (potError) { setPotError(false); setPotErrorMsg("") }
                                }}
                                error={potError}
                                required
                                helperText={potError ? potErrorMsg : ""}
                            />

                            <TextField
                                label="Description"
                                size="small"
                                placeholder="Enter Description"
                                value={potDesc}
                                onChange={(e) => {
                                    setPotDesc(e.target.value.replace(/^\s+/, ""))
                                    if (descError) { setDescError(false); setDescErrorMsg("") }
                                }}
                                error={descError}
                                required
                                helperText={descError ? descErrorMsg : ""}
                            />

                            {!decodedEditPotId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Create
                                </Button>
                            }
                            {decodedEditPotId && [0, 2].includes(Number(accStat)) &&
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
                            <DataTable columns={columns} data={allPotData} loading={loading} />
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