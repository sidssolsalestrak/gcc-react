import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    TextField
} from "@mui/material";
import api from "../../services/api";
import Layout from "../../layout";
import useToast from "../../utils/useToast";

function AddNewDetailingMRT() {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();

    const [doctypeoptions, setDoctypeOptions] = useState([]);
    const [buisnessunitoption, setbuisnessunitoption] = useState([]);
    const [rangeOption, setRangeOption] = useState([]);
    const [regoption, setRegOption] = useState([]);

    const [form, setForm] = useState({
        type: 0,
        Buisnessunit: 0,
        range: 0,
        title: "",      // "" not null, so TextField stays controlled
        region: 0,
        team: 0,
        file: null
    });

    // one handler for all fields
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

    const handleSubmit = async () => {
        if (!form.type || !form.title.trim() || !form.team || !form.file) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            const fd = new FormData();
            fd.append("type", form.type);
            fd.append("business_unit", form.Buisnessunit);
            fd.append("range", form.range);
            fd.append("title", form.title);
            fd.append("region", form.region);
            fd.append("team", form.team);
            fd.append("file", form.file);

            // replace with your actual endpoint
            await api.post("/uploadDetailing", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Detailing uploaded");
        } catch (err) {
            console.log("upload err", err);
            toast.error("something went wrong Try again!!");
        }
    };

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Detailing", path: location.pathname },
                { label: "Upload Detailing", path: location.pathname },
                { label: "Upload New Detailing", path: location.pathname }
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
                    {/* Type */}
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="typelab">Type</InputLabel>
                            <Select
                                labelId="typelab"
                                label="Type"
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                            >
                                <MenuItem value={0}>Select Document</MenuItem>
                                {doctypeoptions.map((val) => (
                                    <MenuItem value={val.id} key={val.id}>{val.doc_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Business Unit */}
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="buLabel">Business Unit</InputLabel>
                            <Select
                                labelId="buLabel"
                                label="Business Unit"
                                name="Buisnessunit"
                                value={form.Buisnessunit}
                                onChange={handleChange}
                            >
                                <MenuItem value={0}>Select Business Unit</MenuItem>
                                {buisnessunitoption.map((val) => (
                                    <MenuItem value={val.id} key={val.id}>{val.brand_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}></Grid>
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}></Grid>

                    {/* Range */}
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="range">Range</InputLabel>
                            <Select
                                labelId="range"
                                label="Range"
                                name="range"
                                value={form.range}
                                onChange={handleChange}
                            >
                                <MenuItem value={0}>General</MenuItem>
                                {rangeOption.map((val) => (
                                    <MenuItem value={val.id} key={val.id}>{val.sub_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Title */}
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

                    {/* Region */}
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="region">Region</InputLabel>
                            <Select
                                labelId="region"
                                label="Region"
                                name="region"
                                value={form.region}
                                onChange={handleChange}
                            >
                                <MenuItem value={0}>Select Region</MenuItem>
                                {regoption.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val.reg_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Team */}
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="team">Team</InputLabel>
                            <Select
                                labelId="team"
                                label="Team"
                                name="team"
                                value={form.team}
                                onChange={handleChange}
                            >
                                <MenuItem value={0}>Select Team</MenuItem>
                                <MenuItem value={1}>Medical Representative</MenuItem>
                                <MenuItem value={2}>Key Account Manager</MenuItem>
                                <MenuItem value={3}>Merchandiser</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* File */}
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <input type="file" onChange={handleFileChange} />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Button size="small" variant="contained" onClick={handleSubmit}>
                            Add
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Layout>
    );
}

export default AddNewDetailingMRT;