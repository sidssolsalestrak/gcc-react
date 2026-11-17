import { Autocomplete, Checkbox, FormControlLabel, Grid, TextField } from '@mui/material'
import React from 'react'
import CommonAppSelect from '../../utils/CommonAppSelect'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const SecondaryInfo = ({ fieldConfig, form, setForm, isHcpField, marketingOptions, ageOptions, socialtypeOption, commonDiseaseOption, campaignoption, fieldErrors = {}, setFieldErrors }) => {
    const clearErr = (key) => setFieldErrors && setFieldErrors((prev) => ({ ...prev, [key]: "" }));

    return (
        <div>
            <Grid container spacing={2} alignItems="center">
                 {/* Social Type */}
                {fieldConfig["Social Type"]?.show &&(<Grid size={{ xs: 12, md: 4, lg:4 }}>
                <CommonAppSelect
                    label={
                        fieldConfig["Social Type"]?.label || "Social Type"
                    }
                   value={form.socialType}
                   options={socialtypeOption}
                   valueKey="id"
                   onChange={(e) =>
                        setForm({ ...form, socialType: e.target.value })
                    }
                   labelKey="social_type"
                />
                </Grid>)}
                {/* Common Diseases Encountered */}
                {fieldConfig["Common Diseases Encountered"]?.show &&(<Grid size={{ xs: 12, md: 4,lg:4 }}>
                <Autocomplete
                    multiple
                    size="small"
                    fullWidth
                    disableCloseOnSelect
                    options={commonDiseaseOption || []}
                    getOptionLabel={(option) => option?.disease_name || ""}
                    isOptionEqualToValue={(option, val) => String(option.id) === String(val.id)}
                    value={(commonDiseaseOption || []).filter((o) =>
                        (Array.isArray(form.commondisease) ? form.commondisease : []).some((id) => String(id) === String(o.id))
                    )}
                    onChange={(e, newValue) =>
                        setForm({ ...form, commondisease: newValue.map((o) => o.id) })
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={fieldConfig["Common Diseases Encountered"]?.label || "Common Diseases Encountered"}
                        />
                    )}
                />
                </Grid>)}
                {fieldConfig['Competitor Preference']?.show && (
                <Grid size={{ xs: 12, md: 4, lg:4 }}>
                  <TextField
                    label="Competitor Preference"
                    fullWidth size="small"
                    value={form.competitorPref}
                    onChange={(e) => {
                        const onlyText = e.target.value.replace(/^\s+/, "");
                        setForm({ ...form, competitorPref: onlyText });
                    }}
                />
                </Grid>)}
                </Grid>
                <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
                {fieldConfig["Campaign"]?.show &&(<Grid size={{ xs: 12, md: 4, lg:4 }}>
                <CommonAppSelect
                    label={
                        fieldConfig["Campaign"]?.label || "Campaign"
                    }
                   value={form.campaign}
                   options={campaignoption}
                   valueKey="id"
                   onChange={(e) =>
                        setForm({ ...form, campaign: e.target.value })
                    }
                   labelKey="campaign_name"
                />
                </Grid>)}
                
                {/* Marketing Tools */}
                {fieldConfig["Marketing Tools"]?.show && (
                    <Grid size={{ xs: 12, md: 3, lg: 4 }}>
                        <Autocomplete
                            multiple
                            size="small"
                            fullWidth
                            disableCloseOnSelect
                            options={marketingOptions || []}
                            getOptionLabel={(option) => option?.marketing_tool_type || ""}
                            isOptionEqualToValue={(option, val) => String(option.id) === String(val.id)}
                            value={(marketingOptions || []).filter((o) =>
                                (Array.isArray(form.marketingTools) ? form.marketingTools : []).some((id) => String(id) === String(o.id))
                            )}
                            onChange={(e, newValue) =>
                                setForm({ ...form, marketingTools: newValue.map((o) => o.id) })
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={fieldConfig["Marketing Tools"]?.label || "Marketing Tools"}
                                />
                            )}
                        />
                    </Grid>
                )}

                 {fieldConfig["Age Group"]?.show && !isHcpField && (
                    <Grid size={{ xs: 12, md: 3, lg: 4 }}>
                        <CommonAppSelect
                            label={fieldConfig["Age Group"]?.label}
                            value={form.agegroup}
                            onChange={(e) =>
                                setForm({ ...form, agegroup: String(e.target.value) })
                            }
                            options={ageOptions}
                            valueKey="id"
                            labelKey="age_grp_name"
                        />
                    </Grid>
                )}

                {/* Hobbies & Interests */}
                {fieldConfig["Hobbies & Interests"]?.show &&(
                <Grid size={{ xs: 12, md: 4,lg:4 }}>
                   <TextField
                        label="Hobbies & Interests"
                        fullWidth size="small"
                        value={form.hobbies?.toString() || ""}
                        onChange={(e) => {
                            const onlyText = e.target.value.replace(/^\s+/, "");
                            setForm({ ...form, hobbies: onlyText });
                        }}
                    />
                </Grid>
                 )}
                </Grid>
                <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
                {/* Birth Date + NA */}
                {fieldConfig["Birthday"]?.show && (
                    <>
                        <Grid size={{ xs: 12, md: 3, lg:3.4 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label={fieldConfig["Birthday"]?.label || "Birth Date"}
                                    value={form.dob ? dayjs(form.dob) : null}
                                    onChange={(newValue) => {
                                        setForm({
                                            ...form,
                                            dob: newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "",
                                        });
                                        if (newValue && newValue.isValid()) clearErr("dob");
                                    }}
                                    format="DD MMM YYYY"
                                    disabled={form.dobNA}
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            fullWidth: true,
                                            required: !form.dobNA,
                                            error: !!fieldErrors.dob,
                                            helperText: fieldErrors.dob || "",
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid size={{ xs: 12, md: 0.6 }} sx={{ display: "flex", alignItems: "center" }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.dobNA}
                                        onChange={(e) => {
                                            setForm((f) => ({ ...f, dobNA: e.target.checked, dob: e.target.checked ? "" : f.dob }));
                                            if (e.target.checked) clearErr("dob");
                                        }}
                                        size="small"
                                    />
                                }
                                label="NA"
                            />
                        </Grid>
                    </>
                )}

                {/* Anniversary + NA */}
                {fieldConfig["Anniversary"]?.show && (
                    <>
                        <Grid size={{ xs: 12, md: 3.4 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label={fieldConfig["Anniversary"]?.label || "Anniversary"}
                                    value={form.anniversary ? dayjs(form.anniversary) : null}
                                    onChange={(newValue) => {
                                        setForm({
                                            ...form,
                                            anniversary: newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "",
                                        });
                                        if (newValue && newValue.isValid()) clearErr("anniversary");
                                    }}
                                    format="DD MMM YYYY"
                                    disabled={form.anniversaryNA}
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            fullWidth: true,
                                            required: !form.anniversaryNA,
                                            error: !!fieldErrors.anniversary,
                                            helperText: fieldErrors.anniversary || "",
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid size={{ xs: 12, md: 0.6 }} sx={{ display: "flex", alignItems: "center" }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.anniversaryNA}
                                        onChange={(e) => {
                                            setForm((f) => ({ ...f, anniversaryNA: e.target.checked, anniversary: e.target.checked ? "" : f.anniversary }));
                                            if (e.target.checked) clearErr("anniversary");
                                        }}
                                        size="small"
                                    />
                                }
                                label="NA"
                            />
                        </Grid>
                    </>
                )}

                {fieldConfig["Age Group"]?.show && isHcpField && (
                    <Grid size={{ xs: 12, md: 3, lg: 4 }}>
                        <CommonAppSelect
                            label={fieldConfig["Age Group"]?.label}
                            value={form.agegroup}
                            onChange={(e) =>
                                setForm({ ...form, agegroup: String(e.target.value) })
                            }
                            options={ageOptions}
                            valueKey="id"
                            labelKey="age_grp_name"
                        />
                    </Grid>
                )}
            </Grid>
        </div>
    )
}

export default SecondaryInfo