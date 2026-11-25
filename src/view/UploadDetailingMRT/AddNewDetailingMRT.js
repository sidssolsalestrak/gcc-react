import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    TextField,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from "@mui/material";
import JSZip from "jszip";
import api from "../../services/api";
import Layout from "../../layout";
import useToast from "../../utils/useToast";
import ConfirmationDialog from "../../utils/confirmDialog";
import CommonAppSelect from "../../utils/CommonAppSelect";
import { downloadFile } from "../../utils/downloadFile";

const FILE_FOLDER = `${process.env.REACT_APP_AWS_FOLDER_NAME}/assets/download`;

function AddNewDetailingMRT() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const toast = useToast();

    let decodedId = 0;
    try {
        decodedId = params.editId ? Number(atob(params.editId)) || 0 : 0;
    } catch (err) {
        decodedId = 0;
    }

    const [doctypeoptions, setDoctypeOptions] = useState([]);
    const [buisnessunitoption, setbuisnessunitoption] = useState([]);
    const [rangeOption, setRangeOption] = useState([]);
    const [regoption, setRegOption] = useState([]);
    const [modifyLoading, setModifyLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [hiddenZip, setHiddenZip] = useState("");
    const [storedPdfName, setStoredPdfName] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewType, setPreviewType] = useState("");
    const [previewName, setPreviewName] = useState("");
    const [mapViewData,setMapViewData] =useState([])
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "primary"
    });

    const [form, setForm] = useState({
        type: 0,
        Buisnessunit: 0,
        range: 0,
        title: "",
        region: [],
        team: 0,
        file: null
    });

    const menuStyle = {
        PaperProps: {
            style: {
                maxHeight: 200
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setForm((prev) => ({ ...prev, file: e.target.files[0] || null }));
    };

    useEffect(() => {
        fetchCatTypeData();
        fetchBuisnessunitData();
        fetchRangeOption();
        fetchRegData();
    }, []);

    useEffect(() => {
        if (decodedId > 0) fetchEditData();
    }, [decodedId]);

    const fetchEditData = async () => {
        try {
            const response = await api.post("/getdoc_type_det", { id: decodedId, doc_type_id: 0 });
            const rows = Array.isArray(response.data.data) ? response.data.data : [];
            const row = rows.find((val) => Number(val.det_id) === decodedId);
            if (!row) {
                toast.error("Detailing not found");
                return;
            }

            let team = 0;
            if (Number(row.med_stat) === 1) team = 1;
            else if (Number(row.kam_stat) === 1) team = 2;
            else if (Number(row.mer_stat) === 1) team = 3;

            setForm({
                type: Number(row.doc_type_id) || 0,
                Buisnessunit: Number(row.cat_id) || 0,
                range: Number(row.subcat_id) || 0,
                title: row.doc_title || "",
                region: row.reg_id
                    ? String(row.reg_id).split(",").filter(Boolean).map((val) => Number(val))
                    : [],
                team,
                file: null
            });
            setHiddenZip(row.file_path || "");
            setStoredPdfName(row.file_name || "");
        } catch (err) {
            console.log("fetch edit data err", err);
            toast.error("something went wrong Try again!!");
        }
    };

    const fetchCatTypeData = async () => {
        try {
            const response = await api.post("/catData");
            setDoctypeOptions(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (err) {
            console.log("Cat type Error", err);
        }
    };

    const fetchBuisnessunitData = async () => {
        try {
            const response = await api.post("/getBuisnessUnitData");
            setbuisnessunitoption(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (err) {
            console.log("get buisness unit err", err);
        }
    };

    const fetchRangeOption = async () => {
        try {
            const response = await api.post("/getRangeData");
            setRangeOption(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (err) {
            console.log("fetch range option err", err);
        }
    };

    const fetchRegData = async () => {
        try {
            const response = await api.post("/getRegData");
            setRegOption(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (err) {
            console.log("fetch reg option err", err);
        }
    };

   const handlePreview = async () => {
    try {
        setPreviewOpen(true);
        setPreviewLoading(true);
        setPreviewUrl("");
        setPreviewType("");

        const mimeMap = {
            pdf: "application/pdf",
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            gif: "image/gif"
        };

        let name = "";
        let data = null;

        if (form.file) {
            name = form.file.name;
            data = form.file;
        } else {
            const res = await api.post(
                "/previewDetailing",
                { det_id: decodedId },
                { responseType: "blob" }
            );
            name = decodeURIComponent(res.headers["x-file-name"] || "file");
            data = res.data;
        }

        const ext = name.split(".").pop().toLowerCase();
        const mime = mimeMap[ext] || "application/octet-stream";
        const url = URL.createObjectURL(new Blob([data], { type: mime }));

        setPreviewName(name);
        setPreviewType(ext === "pdf" ? "pdf" : mimeMap[ext] ? "image" : "other");
        setPreviewUrl(url);
    } catch (err) {
        console.log("preview err", err);
        toast.error("Unable to preview the file");
        setPreviewOpen(false);
    } finally {
        setPreviewLoading(false);
    }
    };

    const handleClosePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
        setPreviewType("");
        setPreviewOpen(false);
    };

    const handleConfirmSubmit = async () => {
        try {
            setModifyLoading(true);
            const buName = buisnessunitoption.find((val) => String(val.id) === String(form.Buisnessunit))?.bu_name || "";
            const selectedRegIds = form.region.map((id) => String(id));
            const regName = regoption
                .filter((val) => selectedRegIds.includes(String(val.id)))
                .map((val) => val.reg_name)
                .join(",");

            const fd = new FormData();
            fd.append("id", decodedId);
            fd.append("hidden_zip", hiddenZip);
            fd.append("type", form.type);
            fd.append("business_unit", form.Buisnessunit);
            fd.append("bu_name", buName);
            fd.append("range", form.range);
            fd.append("title", form.title);
            fd.append("region", selectedRegIds.join(","));
            fd.append("reg_name", regName);
            fd.append("team", form.team);
            if (form.file) fd.append("file", form.file);

            const response = await api.post("/addNewMRT", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (response.data.status === 200) {
                toast.success(response.data.message);
                if (decodedId > 0) navigate(-1);
            } else {
                toast.error(response.data.message);
            }
        } catch (err) {
            console.log("upload err", err);
            toast.error("something went wrong Try again!!");
        } finally {
            setModifyLoading(false);
            setConfirmationDialog((prev) => ({ ...prev, open: false }));
        }
    };

    const handleSubmit = () => {
        const newErrors = {};
        if (form.region.length === 0) newErrors.region = "Please select region";
        setErrors(newErrors);

        const fileMissing = decodedId > 0 ? !form.file && !hiddenZip : !form.file;

        if (!form.type || !form.title.trim() || !form.team || fileMissing || Object.keys(newErrors).length > 0) {
            toast.error("Please fill all required fields");
            return;
        }

        setConfirmationDialog((prev) => ({
            ...prev,
            open: true,
            title: "Confirmation",
            message: decodedId > 0
                ? "Are you sure you want to update this detailing?"
                : "Are you sure you want to upload this detailing?",
            confirmText: "OK",
            cancelText: "Close",
            confirmColor: "primary",
            onConfirm: handleConfirmSubmit
        }));
    };

    const handleMapview=async()=>{
        try{
            let payload={
                doc_id:decodedId
            }
            let response=await api.post('/getDocMapData',payload)
            let data=Array.isArray(response.data.data)? response.data.data:[]
            setMapViewData(data)
        }
        catch(err){
            console.log("map view err",err)
        }
    }

    const storedFileName = hiddenZip ? hiddenZip.split("/").pop() : "";
    const canPreview = Number(form.type) !== 1 && (!!form.file || (decodedId > 0 && !!hiddenZip));

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Detailing", path: location.pathname },
                { label: "Upload Detailing", path: location.pathname },
                { label: decodedId > 0 ? "Edit Detailing" : "Upload New Detailing", path: location.pathname }
            ]}
        >
            <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                    <h1 className="mainTitle">Upload Detailing</h1>
                    <Button size="small" variant="contained" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </Box>

                <Grid
                    container
                    spacing={2}
                    sx={{
                        background: "#fff",
                        borderRadius: "10px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px"
                    }}
                >
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="typelab">Type</InputLabel>
                            <Select
                                labelId="typelab"
                                label="Type"
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                MenuProps={menuStyle}
                            >
                                <MenuItem value={0}>Select Document</MenuItem>
                                {doctypeoptions.map((val) => (
                                    <MenuItem value={val.id} key={val.id}>{val.doc_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="buLabel">Business Unit</InputLabel>
                            <Select
                                labelId="buLabel"
                                label="Business Unit"
                                name="Buisnessunit"
                                value={form.Buisnessunit}
                                onChange={handleChange}
                                MenuProps={menuStyle}
                            >
                                <MenuItem value={0}>Select Business Unit</MenuItem>
                                {buisnessunitoption.map((val) => (
                                    <MenuItem value={val.id} key={val.id}>{val.bu_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="range">Range</InputLabel>
                            <Select
                                labelId="range"
                                label="Range"
                                name="range"
                                value={form.range}
                                onChange={handleChange}
                                MenuProps={menuStyle}
                            >
                                <MenuItem value={0}>General</MenuItem>
                                {rangeOption.map((val) => (
                                    <MenuItem value={val.id} key={val.id}>{val.sub_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <TextField
                            fullWidth
                            label="Title"
                            size="small"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <CommonAppSelect
                            label="Region"
                            value={form.region}
                            onChange={(e) => {
                                setForm((prev) => ({ ...prev, region: e.target.value }));
                                setErrors((prev) => ({ ...prev, region: "" }));
                            }}
                            multiple
                            options={regoption}
                            valueKey="id"
                            labelKey="reg_name"
                            error={Boolean(errors.region)}
                            required={true}
                        />
                        {errors.region && (
                            <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                                {errors.region}
                            </Typography>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="team">Team</InputLabel>
                            <Select
                                labelId="team"
                                label="Team"
                                name="team"
                                value={form.team}
                                onChange={handleChange}
                                MenuProps={menuStyle}
                            >
                                <MenuItem value={0}>Select Team</MenuItem>
                                <MenuItem value={1}>Medical Representative</MenuItem>
                                <MenuItem value={2}>Key Account Manager</MenuItem>
                                <MenuItem value={3}>Merchandiser</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <input type="file" onChange={handleFileChange} />
                        <Box sx={{ display: "flex", gap: 1.5, mt: 1, alignItems: "center" }}>
                            {decodedId > 0 && storedFileName && (
                                <Typography
                                    onClick={() => downloadFile(FILE_FOLDER, storedFileName)}
                                    sx={{
                                        fontSize: "12px",
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {storedFileName}
                                </Typography>
                            )}
                            {canPreview && (
                                <Typography
                                    onClick={handlePreview}
                                    sx={{
                                        fontSize: "12px",
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                        color: "primary.main"
                                    }}
                                >
                                    View
                                </Typography>
                            )}
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box sx={{display:'flex',flexDirection:'row',gap:2}}>
                        <Button size="small" variant="contained" onClick={handleSubmit}>
                            {decodedId > 0 ? "Update" : "Add"}
                        </Button>
                        {decodedId>0 && (
                       <Button size="small" variant="contained" sx={{backgroundColor:'green'}} >
                        Map
                        </Button>
                        )}
                        {decodedId>0 && (
                         <Button size="small" variant="contained" sx={{backgroundColor:'red'}}>
                            Delete
                         </Button>
                        )}
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="lg" fullWidth>
                <DialogTitle>{previewName || "Preview"}</DialogTitle>
                <DialogContent dividers sx={{ height: "75vh", p: 0 }}>
                    {previewLoading && (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                            <CircularProgress />
                        </Box>
                    )}
                    {!previewLoading && previewType === "pdf" && (
                        <iframe
                            title="preview"
                            src={previewUrl}
                            style={{ width: "100%", height: "100%", border: "none" }}
                        />
                    )}
                    {!previewLoading && previewType === "image" && (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                            <img src={previewUrl} alt={previewName} style={{ maxWidth: "100%", maxHeight: "70vh" }} />
                        </Box>
                    )}
                    {!previewLoading && previewType === "other" && (
                        <Box sx={{ p: 3 }}>
                            <Typography>Preview is not available for this file type. Please download it instead.</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" color="error" onClick={handleClosePreview}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={() => setConfirmationDialog((prev) => ({ ...prev, open: false }))}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={modifyLoading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout>
    );
}

export default AddNewDetailingMRT;