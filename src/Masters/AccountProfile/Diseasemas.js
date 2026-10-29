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

export default function DiseaseMas() {

    const { editDiseaseId } = useParams()
    const decodedEditDiseaseId = editDiseaseId !== undefined && editDiseaseId !== null ? Number(atob(editDiseaseId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [diseaseName, setDiseaseName] = useState("")
    const [hdnDiseaseName, setHdnDiseaseName] = useState("")

    const [allDiseaseData, setAllDiseaseData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [diseaseError, setDiseaseError] = useState(false)
    const [diseaseErrorMsg, setDiseaseErrorMsg] = useState("")

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const diseaseLabel = masterPanel["DISE"] || "Common Disease Type";
    usePageTitle(diseaseLabel || "Common Disease Type")

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllDisease()
    }, [])

    useEffect(() => {
        if (!decodedEditDiseaseId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditDiseaseId)
        // eslint-disable-next-line
    }, [decodedEditDiseaseId])

    const resetFields = () => {
        setDiseaseName(""); setHdnDiseaseName("")
        setDiseaseError(false); setDiseaseErrorMsg("")
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchAllDisease = async () => {
        try {
            let response = await api.post("/readDisease", { disease_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllDiseaseData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllDisease error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readDisease", { disease_id: id })
            let data = response.data.data[0]
            setDiseaseName(data.disease_name || "")
            setHdnDiseaseName(data.disease_name || "")
            setDiseaseError(false); setDiseaseErrorMsg("")
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        setDiseaseError(false); setDiseaseErrorMsg("")

        if (!diseaseName || diseaseName.trim() === "") {
            setDiseaseError(true)
            setDiseaseErrorMsg("The Disease Name field is required.")
            toast.error("Please fix all mandatory fields")
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        try {
            setModifyLoading(true)
            const payload = { disease_name: diseaseName.trim() }

            if (decodedEditDiseaseId) {
                let check = hdnDiseaseName.toLowerCase().trim() === diseaseName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/diseaseUpdate", { id: decodedEditDiseaseId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllDisease()
                    navigate('/masters/disease')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/diseaseCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllDisease()
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
        navigate(`/masters/disease/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteDisease", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllDisease()
        } catch (err) {
            console.log("deleteDisease error", err)
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
            title: `${decodedEditDiseaseId ? "Edit" : "Add"} ${diseaseLabel}`,
            message: `Are you sure you want to ${decodedEditDiseaseId ? "Edit" : "Add"} this ${diseaseLabel}?`,
            confirmText: decodedEditDiseaseId ? "Update" : "Add",
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

    const isUnchanged = hdnDiseaseName.toLowerCase().trim() === diseaseName.toLowerCase().trim()

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "disease_name", headerName: "Disease Name", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.diseaseID)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>}
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.diseaseID)}>
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
                { label: "Master", path: "/masters/disease" },
                { label: diseaseLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{diseaseLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditDiseaseId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {diseaseLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <TextField
                                label="Disease Name"
                                size="small"
                                placeholder="Enter disease Type"
                                value={diseaseName}
                                onChange={(e) => {
                                    setDiseaseName(e.target.value.replace(/^\s+/, ""))
                                    if (diseaseError) { setDiseaseError(false); setDiseaseErrorMsg("") }
                                }}
                                error={diseaseError}
                                required
                                helperText={diseaseError ? diseaseErrorMsg : ""}
                            />

                            {!decodedEditDiseaseId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Create
                                </Button>
                            }
                            {decodedEditDiseaseId && [0, 2].includes(Number(accStat)) &&
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
                            <DataTable columns={columns} data={allDiseaseData} loading={loading} />
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