import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab,
    IconButton, Autocomplete
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

export default function Hospital() {

    const { editHospId } = useParams()
    const decodedEditHospId = editHospId !== undefined && editHospId !== null ? Number(atob(editHospId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    const [tabValue, setTabValue] = useState(1)
    const [hospName, setHospName] = useState("")
    const [hdnHospName, setHdnHospName] = useState("")
    const [selBeat, setSelBeat] = useState("0")
    const [hdnSelBeat, setHdnSelBeat] = useState("0")
    const [hospAddr, setHospAddr] = useState("")
    const [hdnHospAddr, setHdnHospAddr] = useState("")
    const [hospTel, setHospTel] = useState("")
    const [hdnHospTel, setHdnHospTel] = useState("")
    const [hospPin, setHospPin] = useState("")
    const [hdnHospPin, setHdnHospPin] = useState("")

    const [allBeat, setAllBeat] = useState([])
    const [allHospData, setAllHospData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [accStat, setAccStat] = useState(null)

    const [hospError, setHospError] = useState(false)
    const [hospErrorMsg, setHospErrorMsg] = useState("")
    const [beatError, setBeatError] = useState(false)
    const [telError, setTelError] = useState(false)
    const [telErrorMsg, setTelErrorMsg] = useState("")
    const [pinError, setPinError] = useState(false)
    const [pinErrorMsg, setPinErrorMsg] = useState("")

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })
    const [masterPanel, setMasterPanel] = useState({});

    const hospLabel = masterPanel["HOSP"] || "Hospital / Institution";
    const beatLabel = masterPanel["BEAT"] || "Beat";
    usePageTitle(hospLabel || "Hospital / Institution")

    // Beat API returns `id` (not `beatID`)
    const DEFAULT_BEAT = { id: "0", beat_name: `Select ${beatLabel}` }

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchAllHospital()
        fetchAllBeat()
    }, [])

    useEffect(() => {
        if (!decodedEditHospId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditHospId)
        // eslint-disable-next-line
    }, [decodedEditHospId])

    const resetFields = () => {
        setHospName(""); setHdnHospName("")
        setSelBeat("0"); setHdnSelBeat("0")
        setHospAddr(""); setHdnHospAddr("")
        setHospTel(""); setHdnHospTel("")
        setHospPin(""); setHdnHospPin("")
        setHospError(false); setHospErrorMsg("")
        setBeatError(false)
        setTelError(false); setTelErrorMsg("")
        setPinError(false); setPinErrorMsg("")
    }

    const storeAccStat = (response) => {
        setAccStat(response?.data?.acc_stat ?? null)
        if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
            localStorage.setItem("acc_stat", response?.data?.acc_stat)
        }
    }

    const fetchAllHospital = async () => {
        try {
            let response = await api.post("/readHospital", { hosp_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllHospData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
            storeAccStat(response)
        } catch (err) {
            console.log("fetchAllHospital error", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchAllBeat = async () => {
        try {
            let response = await api.post("/readBeat", { beat_id: null, ter_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllBeat(data)
        } catch (err) {
            console.log("fetchAllBeat error", err)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readHospital", { hosp_id: id })
            let data = response.data.data[0]
            setHospName(data.hosp_name || "")
            setHdnHospName(data.hosp_name || "")
            setSelBeat(data.beat_id)
            setHdnSelBeat(data.beat_id)
            setHospAddr(data.hosp_addr || "")
            setHdnHospAddr(data.hosp_addr || "")
            setHospTel(data.hosp_tel || "")
            setHdnHospTel(data.hosp_tel || "")
            setHospPin(data.hosp_pin || "")
            setHdnHospPin(data.hosp_pin || "")
            setHospError(false); setHospErrorMsg("")
            setBeatError(false)
            setTelError(false); setTelErrorMsg("")
            setPinError(false); setPinErrorMsg("")
            setTabValue(0)
            storeAccStat(response)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateFields = () => {
        let isValid = true
        setHospError(false); setHospErrorMsg("")
        setBeatError(false)
        setTelError(false); setTelErrorMsg("")
        setPinError(false); setPinErrorMsg("")

        if (!hospName || hospName.trim() === "") {
            setHospError(true)
            setHospErrorMsg(`The Name field is required.`)
            isValid = false
        }

        if (!selBeat || Number(selBeat) === 0) {
            setBeatError(true)
            isValid = false
        }

        // Optional fields: validate only when filled
        if (hospTel && !/^\d{6,15}$/.test(hospTel)) {
            setTelError(true)
            setTelErrorMsg("Enter a valid telephone number (6 to 15 digits).")
            isValid = false
        }

        if (hospPin && !/^\d{6}$/.test(hospPin)) {
            setPinError(true)
            setPinErrorMsg("Pin must be 6 digits.")
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
                hosp_name: hospName.trim(),
                beat_id: selBeat,
                hosp_addr: hospAddr.trim() || null,
                hosp_tel: hospTel || null,
                hosp_pin: hospPin || null
            }

            if (decodedEditHospId) {
                let check = hdnHospName.toLowerCase().trim() === hospName.toLowerCase().trim() ? 0 : 1
                let response = await api.post("/hospitalUpdate", { id: decodedEditHospId, ...payload, check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchAllHospital()
                    navigate('/masters/hospital')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/hospitalCreate", payload)
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchAllHospital()
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
        navigate(`/masters/hospital/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteHospital", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchAllHospital()
        } catch (err) {
            console.log("deleteHospital error", err)
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
            title: `${decodedEditHospId ? "Edit" : "Add"} ${hospLabel}`,
            message: `Are you sure you want to ${decodedEditHospId ? "Edit" : "Add"} this ${hospLabel}?`,
            confirmText: decodedEditHospId ? "Update" : "Add",
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

    const beatOptions = decodedEditHospId ? allBeat : [DEFAULT_BEAT, ...allBeat]

    const isUnchanged =
        hdnHospName.toLowerCase().trim() === hospName.toLowerCase().trim() &&
        String(hdnSelBeat) === String(selBeat) &&
        hdnHospAddr.trim() === hospAddr.trim() &&
        String(hdnHospTel) === String(hospTel) &&
        String(hdnHospPin) === String(hospPin)

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "hosp_name", headerName: `${hospLabel} Name`, filterable: true, sortable: true },
        { field: "beat_name", headerName: `${beatLabel} Name`, filterable: true, sortable: true },
        { field: "hosp_addr", headerName: "Address", filterable: true, sortable: true },
        { field: "hosp_tel", headerName: "Telephone", filterable: true, sortable: true },
        { field: "hosp_pin", headerName: "Pin", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <Box sx={{display:'flex'}}>
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.hospID)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>}
                    {[0, 2].includes(Number(accStat)) &&
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.hospID)}>
                            <DeleteIcon size={15} />
                        </IconButton>}
                </Box>
            )
        }
    ]

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Master", path: "/masters/hospital" },
                { label: hospLabel, path: location.pathname },
            ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{hospLabel}</h1>
                </Box>

                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '65%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedEditHospId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {hospLabel} Details</Typography>
                    }

                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                            <TextField
                                label={`${hospLabel}`}
                                size="small"
                                placeholder={`Enter ${hospLabel} Name`}
                                value={hospName}
                                onChange={(e) => {
                                    setHospName(e.target.value.replace(/^\s+/, ""))
                                    if (hospError) { setHospError(false); setHospErrorMsg("") }
                                }}
                                error={hospError}
                                required
                                helperText={hospError ? hospErrorMsg : ""}
                            />

                            <Autocomplete
                                options={beatOptions}
                                getOptionLabel={(option) => option.beat_name || ""}
                                value={beatOptions.find((b) => String(b.id) === String(selBeat)) || null}
                                onChange={(e, newVal) => {
                                    setSelBeat(newVal ? newVal.id : "0")
                                    if (beatError) setBeatError(false)
                                }}
                                disableClearable={!!decodedEditHospId}
                                isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id}>
                                        {option.beat_name}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`${beatLabel}`}
                                        size="small"
                                        required
                                        error={beatError}
                                        helperText={beatError ? `The ${beatLabel}  field is required.` : ""}
                                    />
                                )}
                            />

                            <TextField
                                label="Address"
                                size="small"
                                placeholder="Address"
                                value={hospAddr}
                                onChange={(e) => setHospAddr(e.target.value.replace(/^\s+/, ""))}
                            />

                            <TextField
                                label="Telephone"
                                size="small"
                                placeholder="Telephone"
                                value={hospTel}
                                inputProps={{ maxLength: 15, inputMode: 'numeric' }}
                                onChange={(e) => {
                                    setHospTel(e.target.value.replace(/\D/g, ""))
                                    if (telError) { setTelError(false); setTelErrorMsg("") }
                                }}
                                error={telError}
                                helperText={telError ? telErrorMsg : ""}
                            />

                            <TextField
                                label="Pin"
                                size="small"
                                placeholder="Enter Pin"
                                value={hospPin}
                                inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                                onChange={(e) => {
                                    setHospPin(e.target.value.replace(/\D/g, ""))
                                    if (pinError) { setPinError(false); setPinErrorMsg("") }
                                }}
                                error={pinError}
                                helperText={pinError ? pinErrorMsg : ""}
                            />

                            {!decodedEditHospId && [0, 1, 2].includes(Number(accStat)) &&
                                <Button
                                    variant="contained"
                                    sx={{ width: '2rem', textTransform: 'none' }}
                                    onClick={() => { if (validateFields()) showSubmitConfirmation() }}
                                >
                                    Create
                                </Button>
                            }
                            {decodedEditHospId && [0, 2].includes(Number(accStat)) &&
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
                            <DataTable columns={columns} data={allHospData} loading={loading} />
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