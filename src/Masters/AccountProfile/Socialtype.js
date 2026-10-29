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

export default function SocialType() {

    const { editSocialId } = useParams()
    const decodedEditSocialId = editSocialId !== undefined && editSocialId !== null ? Number(atob(editSocialId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [socialName, setSocialName] = useState("")
    const [hdnSocialName, setHdnSocialName] = useState("")

    const [allSocialData, setAllSocialData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [socialError, setSocialError] = useState(false)
    const [socialErrorMsg, setSocialErrorMsg] = useState("")

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const socialLabel = masterPanel["SOCL"] || "Social Type";
    usePageTitle(socialLabel || "Social Type")

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllSocial()
    }, [])

    useEffect(() => {
        if (!decodedEditSocialId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditSocialId)
        // eslint-disable-next-line
    }, [decodedEditSocialId])

    const resetFields = () => {
        setSocialName(""); setHdnSocialName("")
        setSocialError(false); setSocialErrorMsg("")
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchAllSocial = async () => {
        try {
            let response = await api.post("/readSocial", { social_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllSocialData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllSocial error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readSocial", { social_id: id })
            let data = response.data.data[0]
            setSocialName(data.social_type || "")
            setHdnSocialName(data.social_type || "")
            setSocialError(false); setSocialErrorMsg("")
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        setSocialError(false); setSocialErrorMsg("")

        if (!socialName || socialName.trim() === "") {
            setSocialError(true)
            setSocialErrorMsg("The Social Type field is required.")
            toast.error("Please fix all mandatory fields")
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        try {
            setModifyLoading(true)
            const payload = { social_type: socialName.trim() }

            if (decodedEditSocialId) {
                let check = hdnSocialName.toLowerCase().trim() === socialName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/socialUpdate", { id: decodedEditSocialId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllSocial()
                    navigate('/masters/social')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/socialCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllSocial()
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
        navigate(`/masters/social/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteSocial", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllSocial()
        } catch (err) {
            console.log("deleteSocial error", err)
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
            title: `${decodedEditSocialId ? "Edit" : "Add"} ${socialLabel}`,
            message: `Are you sure you want to ${decodedEditSocialId ? "Edit" : "Add"} this ${socialLabel}?`,
            confirmText: decodedEditSocialId ? "Update" : "Add",
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

    const isUnchanged = hdnSocialName.toLowerCase().trim() === socialName.toLowerCase().trim()

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "social_type", headerName: "Social Type", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.socialID)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>}
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.socialID)}>
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
                { label: "Master", path: "/masters/social" },
                { label: socialLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{socialLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditSocialId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {socialLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <TextField
                                label="Social Type"
                                size="small"
                                placeholder="Enter social Type"
                                value={socialName}
                                onChange={(e) => {
                                    setSocialName(e.target.value.replace(/^\s+/, ""))
                                    if (socialError) { setSocialError(false); setSocialErrorMsg("") }
                                }}
                                error={socialError}
                                required
                                helperText={socialError ? socialErrorMsg : ""}
                            />

                            {!decodedEditSocialId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Create
                                </Button>
                            }
                            {decodedEditSocialId && [0, 2].includes(Number(accStat)) &&
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
                            <DataTable columns={columns} data={allSocialData} loading={loading} />
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