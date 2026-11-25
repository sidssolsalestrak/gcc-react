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

export default function PosMaterial() {

    const { editPosId } = useParams()
    const decodedEditPosId = editPosId !== undefined && editPosId !== null ? Number(atob(editPosId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [posName, setPosName] = useState("")
    const [hdnPosName, setHdnPosName] = useState("")

    const [allPosData, setAllPosData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [posError, setPosError] = useState(false)
    const [posErrorMsg, setPosErrorMsg] = useState("")

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const posLabel = masterPanel["POSM"] || "POS Material";
    usePageTitle(posLabel)

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllPos()
    }, [])

    useEffect(() => {
        if (!decodedEditPosId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditPosId)
        // eslint-disable-next-line
    }, [decodedEditPosId])

    const resetFields = () => {
        setPosName(""); setHdnPosName("")
        setPosError(false); setPosErrorMsg("")
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchAllPos = async () => {
        try {
            let response = await api.post("/readPos", { pos_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllPosData(data.map((item, index) => ({
                ...item,
                si_no: index + 1
            })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllPos error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readPos", { pos_id: id })
            let data = response.data.data[0]
            setPosName(data.pos_name || "")
            setHdnPosName(data.pos_name || "")
            setPosError(false); setPosErrorMsg("")
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        let isValid = true
        setPosError(false); setPosErrorMsg("")

        if (!posName || posName.trim() === "") {
            setPosError(true)
            setPosErrorMsg("The POS Name field is required.")
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
                pos_name: posName.trim()
            }

            if (decodedEditPosId) {
                let check = hdnPosName.toLowerCase().trim() === posName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/posUpdate", { id: decodedEditPosId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllPos()
                    navigate('/masters/pos')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/posCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllPos()
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
        navigate(`/masters/pos/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deletePos", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllPos()
        } catch (err) {
            console.log("deletePos error", err)
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
            title: `${decodedEditPosId ? "Edit" : "Add"} ${posLabel}`,
            message: `Are you sure you want to ${decodedEditPosId ? "Edit" : "Add"} this ${posLabel}?`,
            confirmText: decodedEditPosId ? "Update" : "Add",
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

    const isUnchanged = hdnPosName.toLowerCase().trim() === posName.toLowerCase().trim()

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "pos_name", headerName: "POS Name", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.posID)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>}
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.posID)}>
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
                { label: "Masters", path: "/masters/pos" },
                { label: posLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{posLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditPosId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {posLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <TextField
                                label="POS Material Name"
                                size="small"
                                placeholder="Enter POS Name"
                                value={posName}
                                onChange={(e) => {
                                    setPosName(e.target.value.replace(/^\s+/, ""))
                                    if (posError) { setPosError(false); setPosErrorMsg("") }
                                }}
                                error={posError}
                                required
                                helperText={posError ? posErrorMsg : ""}
                            />

                            {!decodedEditPosId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Submit
                                </Button>
                            }
                            {decodedEditPosId && [0, 2].includes(Number(accStat)) &&
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
                            <DataTable columns={columns} data={allPosData} loading={loading} />
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