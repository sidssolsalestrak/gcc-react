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

export default function CompitatorBrands() {

    const { editCompId } = useParams()
    const decodedEditCompId = editCompId !== undefined && editCompId !== null ? Number(atob(editCompId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [compName, setCompName] = useState("")
    const [hdnCompName, setHdnCompName] = useState("")

    const [allCompData, setAllCompData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [compError, setCompError] = useState(false)
    const [compErrorMsg, setCompErrorMsg] = useState("")

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const compLabel = masterPanel["COMP"] || "Compitator";
    usePageTitle(compLabel)

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllComp()
    }, [])

    useEffect(() => {
        if (!decodedEditCompId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditCompId)
        // eslint-disable-next-line
    }, [decodedEditCompId])

    const resetFields = () => {
        setCompName(""); setHdnCompName("")
        setCompError(false); setCompErrorMsg("")
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchAllComp = async () => {
        try {
            let response = await api.post("/readCompitator", { comp_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllCompData(data.map((item, index) => ({
                ...item,
                si_no: index + 1
            })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllComp error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readCompitator", { comp_id: id })
            let data = response.data.data[0]
            setCompName(data.comp_name || "")
            setHdnCompName(data.comp_name || "")
            setCompError(false); setCompErrorMsg("")
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        let isValid = true
        setCompError(false); setCompErrorMsg("")

        if (!compName || compName.trim() === "") {
            setCompError(true)
            setCompErrorMsg("The Compitator Name field is required.")
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
                comp_name: compName.trim()
            }

            if (decodedEditCompId) {
                let check = hdnCompName.toLowerCase().trim() === compName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/compitatorUpdate", { id: decodedEditCompId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllComp()
                    navigate('/masters/compitator')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/compitatorCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllComp()
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
        navigate(`/masters/compitator/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteCompitator", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllComp()
        } catch (err) {
            console.log("deleteCompitator error", err)
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
            title: `${decodedEditCompId ? "Edit" : "Add"} ${compLabel}`,
            message: `Are you sure you want to ${decodedEditCompId ? "Edit" : "Add"} this ${compLabel}?`,
            confirmText: decodedEditCompId ? "Update" : "Add",
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

    const isUnchanged = hdnCompName.toLowerCase().trim() === compName.toLowerCase().trim()

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "comp_name", headerName: compLabel, filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.compID)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>}
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.compID)}>
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
                { label: "Masters", path: "/masters/compitator" },
                { label: compLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{compLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditCompId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {compLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <TextField
                                label={compLabel}
                                size="small"
                                placeholder={`Enter ${compLabel}`}
                                value={compName}
                                onChange={(e) => {
                                    setCompName(e.target.value.replace(/^\s+/, ""))
                                    if (compError) { setCompError(false); setCompErrorMsg("") }
                                }}
                                error={compError}
                                required
                                helperText={compError ? compErrorMsg : ""}
                            />

                            {!decodedEditCompId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Submit
                                </Button>
                            }
                            {decodedEditCompId && [0, 2].includes(Number(accStat)) &&
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
                            <DataTable columns={columns} data={allCompData} loading={loading} />
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