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

export default function LoyaltyType() {

    const { editloyaltyId } = useParams()
    const decodedEditLoyaltyId = editloyaltyId !== undefined && editloyaltyId !== null ? Number(atob(editloyaltyId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [loyaltyName, setLoyaltyName] = useState("")
    const [hdnLoyaltyName, setHdnLoyaltyName] = useState("")

    const [allLoyaltyData, setAllLoyaltyData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [loyaltyError, setLoyaltyError] = useState(false)
    const [loyaltyErrorMsg, setLoyaltyErrorMsg] = useState("")

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const loyaltyLabel = masterPanel["LOYA"] || "Loyalty Type";
    usePageTitle(loyaltyLabel || "Loyalty Type")

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllLoyalty()
    }, [])

    useEffect(() => {
        if (!decodedEditLoyaltyId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditLoyaltyId)
        // eslint-disable-next-line
    }, [decodedEditLoyaltyId])

    const resetFields = () => {
        setLoyaltyName(""); setHdnLoyaltyName("")
        setLoyaltyError(false); setLoyaltyErrorMsg("")
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchAllLoyalty = async () => {
        try {
            let response = await api.post("/readLoyalty", { id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllLoyaltyData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllLoyalty error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readLoyalty", { id: id })
            let data = response.data.data[0]
            setLoyaltyName(data.loyalty_type || "")
            setHdnLoyaltyName(data.loyalty_type || "")
            setLoyaltyError(false); setLoyaltyErrorMsg("")
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        let isValid = true
        setLoyaltyError(false); setLoyaltyErrorMsg("")

        if (!loyaltyName || loyaltyName.trim() === "") {
            setLoyaltyError(true)
            setLoyaltyErrorMsg("The loyalty Name field is required.")
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
                loyalty_type: loyaltyName.trim()
            }

            if (decodedEditLoyaltyId) {
                let check = hdnLoyaltyName.toLowerCase().trim() === loyaltyName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/loyaltyUpdate", { id: decodedEditLoyaltyId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllLoyalty()
                    navigate('/masters/loyalty')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/loyaltyCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllLoyalty()
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
        navigate(`/masters/loyalty/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteLoyalty", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllLoyalty()
        } catch (err) {
            console.log("deleteLoyalty error", err)
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
            title: `${decodedEditLoyaltyId ? "Edit" : "Add"} ${loyaltyLabel}`,
            message: `Are you sure you want to ${decodedEditLoyaltyId ? "Edit" : "Add"} this ${loyaltyLabel}?`,
            confirmText: decodedEditLoyaltyId ? "Update" : "Add",
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

    const isUnchanged = hdnLoyaltyName.toLowerCase().trim() === loyaltyName.toLowerCase().trim()

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "loyalty_type", headerName: "Loyalty Type", filterable: true, sortable: true },
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
                { label: "Master", path: "/masters/loyalty" },
                { label: loyaltyLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{loyaltyLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditLoyaltyId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {loyaltyLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <TextField
                                label="Loyalty Type"
                                size="small"
                                placeholder="Enter loyalty Type"
                                value={loyaltyName}
                                onChange={(e) => {
                                    setLoyaltyName(e.target.value.replace(/^\s+/, ""))
                                    if (loyaltyError) { setLoyaltyError(false); setLoyaltyErrorMsg("") }
                                }}
                                error={loyaltyError}
                                required
                                helperText={loyaltyError ? loyaltyErrorMsg : ""}
                            />

                            {!decodedEditLoyaltyId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Submit
                                </Button>
                            }
                            {decodedEditLoyaltyId && [0, 2].includes(Number(accStat)) &&
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
                            <DataTable columns={columns} data={allLoyaltyData} loading={loading} />
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