import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Checkbox, Divider, FormControlLabel, Grid, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import CommonAppSelect from '../../utils/CommonAppSelect';

const headContainer = {
    display: "flex", flexDirection: 'column', gap: 2, m: 1.5,
    width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}

const subHeaderStyle = { textDecoration: "underline", textUnderlineOffset: "5px", textDecorationColor: "#ccc" }

const disabledBgSx = {
    "& .MuiInputBase-root.Mui-disabled, & .MuiPickersInputBase-root.Mui-disabled, & .MuiPickersOutlinedInput-root.Mui-disabled": {
        backgroundColor: "#EEEEEE",
    },
};

// Only cus_mas fields remain here.
// Shipping Address / City / Pincode and Contact Person / No / No 2 (cus_det) now live in ContactInfo.
const SECTION_KEYS = [
    "Credit Limit for Customer", "Customer Payment Terms", "Customer-Payment Method", "Currency",
    "Advanced Received", "Is GST Register", "Customer-GST No", "PAN No", "MSME Reg No.", "Medical Reg. No",
    "DL.1", "DL.2", "Retail Lic.1", "Retail Lic.2",
];

const ADV_OPTIONS = [
    { id: "0", name: "No" },
    { id: "1", name: "Yes" },
];

const LICENCE_GROUPS = [
    {
        naKey: "dlNA",
        naLabel: "DL NA",
        rows: [
            [
                { k: "dl1", cfg: "DL.1", label: "DL 1", type: "text", req: true },
                { k: "dl1From", cfg: "DL.1 Valid From", label: "DL 1 Valid From", type: "date", req: true },
                { k: "dl1To", cfg: "DL.1 Valid upto", label: "DL 1 Valid to", type: "date", req: true },
            ],
            [
                { k: "dl2", cfg: "DL.2", label: "DL 2", type: "text", req: false },
                { k: "dl2From", cfg: "DL.2 Valid From", label: "DL 2 Valid From", type: "date", req: false },
                { k: "dl2To", cfg: "DL.2 Valid upto", label: "DL 2 Valid to", type: "date", req: false },
            ],
        ],
    },
    {
        naKey: "retNA",
        naLabel: "Retail Lic NA",
        rows: [
            [
                { k: "retLic1", cfg: "Retail Lic.1", label: "Retail Lic.1", type: "text", req: true },
                { k: "retLic1From", cfg: "Retail Lic.1 Valid From", label: "Retail Lic.1 Valid From", type: "date", req: true },
                { k: "retLic1To", cfg: "Retail Lic.1 Valid upto", label: "Retail Lic.1 Valid to", type: "date", req: true },
            ],
            [
                { k: "retLic2", cfg: "Retail Lic.2", label: "Retail Lic.2", type: "text", req: false },
                { k: "retLic2From", cfg: "Retail Lic.2 Valid From", label: "Retail Lic.2 Valid From", type: "date", req: false },
                { k: "retLic2To", cfg: "Retail Lic.2 Valid upto", label: "Retail Lic.2 Valid to", type: "date", req: false },
            ],
        ],
    },
];

const BillingInfo = ({
    fieldConfig,
    form,
    setForm,
    payModeOptions = [],
    currencyOptions = [],
    fieldErrors = {},
    setFieldErrors,
}) => {
    if (!SECTION_KEYS.some((k) => fieldConfig[k]?.show)) return null;

    return (
        <div style={{ marginBottom: "3%" }}>
            <Box sx={headContainer}>
                <Box sx={{ p: 0, overflow: "hidden" }}>
                    <Accordion sx={{ boxShadow: "none" }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderTop: "4px solid #2196f3" }}>
                            <Typography variant="h6" color="initial" sx={subHeaderStyle}>
                                Billing Info
                            </Typography>
                        </AccordionSummary>
                        <Divider />
                        <AccordionDetails sx={{ pt: 2 }}>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                {fieldConfig["Credit Limit for Customer"]?.show && (
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <TextField
                                            label={fieldConfig["Credit Limit for Customer"]?.label || "Credit Limit for Customer"}
                                            fullWidth size="small"
                                            value={form.crLimit || ""}
                                            onChange={(e) => setForm((f) => ({ ...f, crLimit: e.target.value.replace(/\D/g, "") }))}
                                        />
                                    </Grid>
                                )}

                                {fieldConfig["Customer Payment Terms"]?.show && (
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <TextField
                                            label={fieldConfig["Customer Payment Terms"]?.label || "Customer Payment Terms"}
                                            fullWidth size="small"
                                            value={form.payTerms || ""}
                                            onChange={(e) => setForm((f) => ({ ...f, payTerms: e.target.value.replace(/\D/g, "") }))}
                                        />
                                    </Grid>
                                )}

                                {fieldConfig["Customer-Payment Method"]?.show && (
                                    <Grid size={{ xs: 12, md: 2 }}>
                                        <CommonAppSelect
                                            label={fieldConfig["Customer-Payment Method"]?.label || "Customer Payment method"}
                                            value={form.payMode || "0"}
                                            onChange={(e) => setForm((f) => ({ ...f, payMode: String(e.target.value) }))}
                                            options={[{ id: "0", pay_name: "Select Payment Method" }, ...payModeOptions]}
                                            valueKey="id"
                                            labelKey="pay_name"
                                        />
                                    </Grid>
                                )}

                                {fieldConfig["Currency"]?.show && (
                                    <Grid size={{ xs: 12, md: 2 }}>
                                        <CommonAppSelect
                                            label={fieldConfig["Currency"]?.label || "Currency"}
                                            value={form.currency || "0"}
                                            onChange={(e) => {
                                                setForm((f) => ({ ...f, currency: String(e.target.value) }));
                                                setFieldErrors((prev) => ({ ...prev, currency: "" }));
                                            }}
                                            options={[{ id: "0", currency_code: "Select Currency" }, ...currencyOptions]}
                                            valueKey="id"
                                            labelKey="currency_code"
                                            required={true}
                                            error={!!fieldErrors.currency}
                                            helperText={fieldErrors.currency}
                                        />
                                    </Grid>
                                )}

                                {fieldConfig["Advanced Received"]?.show && (
                                    <Grid size={{ xs: 12, md: 2 }}>
                                        <CommonAppSelect
                                            label={fieldConfig["Advanced Received"]?.label || "Adv"}
                                            value={form.advStat || "0"}
                                            onChange={(e) => setForm((f) => ({ ...f, advStat: String(e.target.value) }))}
                                            options={ADV_OPTIONS}
                                            valueKey="id"
                                            labelKey="name"
                                            required={true}
                                        />
                                    </Grid>
                                )}
                            </Grid>

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                {fieldConfig["Is GST Register"]?.show && (
                                    <Grid size={{ xs: 12, md: 2, lg: 1.8 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={!!form.gstStat}
                                                    onChange={(e) => {
                                                        setForm((f) => ({ ...f, gstStat: e.target.checked }));
                                                        setFieldErrors((prev) => ({ ...prev, gstNo: "" }));
                                                    }}
                                                />
                                            }
                                            label={fieldConfig["Is GST Register"]?.label || "Is GST Register"}
                                        />
                                    </Grid>
                                )}

                                {fieldConfig["Customer-GST No"]?.show && (
                                    <Grid size={{ xs: 12, md: 3, lg: 3.2 }}>
                                        <TextField
                                            label={fieldConfig["Customer-GST No"]?.label || "Customer GST No"}
                                            fullWidth size="small"
                                            disabled={!form.gstStat}
                                            required={!!form.gstStat}
                                            sx={disabledBgSx}
                                            value={form.gstNo || ""}
                                            onChange={(e) => {
                                                setForm((f) => ({ ...f, gstNo: e.target.value.replace(/^\s+/, "") }));
                                                setFieldErrors((prev) => ({ ...prev, gstNo: "" }));
                                            }}
                                            error={!!fieldErrors.gstNo}
                                            helperText={fieldErrors.gstNo}
                                        />
                                    </Grid>
                                )}

                                {fieldConfig["PAN No"]?.show && (
                                    <Grid size={{ xs: 12, md: 3 }}>
                                        <TextField
                                            label={fieldConfig["PAN No"]?.label || "PAN No."}
                                            fullWidth size="small"
                                            value={form.panNo || ""}
                                            onChange={(e) => setForm((f) => ({ ...f, panNo: e.target.value.replace(/^\s+/, "") }))}
                                        />
                                    </Grid>
                                )}

                                {fieldConfig["MSME Reg No."]?.show && (
                                    <Grid size={{ xs: 12, md: 2 }}>
                                        <TextField
                                            label={fieldConfig["MSME Reg No."]?.label || "MSME Reg No."}
                                            fullWidth size="small"
                                            value={form.msmeNo || ""}
                                            onChange={(e) => setForm((f) => ({ ...f, msmeNo: e.target.value.replace(/^\s+/, "") }))}
                                        />
                                    </Grid>
                                )}

                                {fieldConfig["Medical Reg. No"]?.show && (
                                    <Grid size={{ xs: 12, md: 2 }}>
                                        <TextField
                                            label={fieldConfig["Medical Reg. No"]?.label || "Dr Reg No."}
                                            fullWidth size="small"
                                            value={form.drRegNo || ""}
                                            onChange={(e) => {
                                                setForm((f) => ({ ...f, drRegNo: e.target.value.replace(/^\s+/, "") }));
                                                setFieldErrors((prev) => ({ ...prev, drRegNo: "" }));
                                            }}
                                            error={!!fieldErrors.drRegNo}
                                            helperText={fieldErrors.drRegNo}
                                            required
                                        />
                                    </Grid>
                                )}
                            </Grid>

                            {LICENCE_GROUPS.map((g) => fieldConfig[g.rows[0][0].cfg]?.show && (
                                <React.Fragment key={g.naKey}>
                                    {g.rows.map((row, ri) => (
                                        <Grid container spacing={2} sx={{ mb: 2 }} key={ri}>
                                            <Grid size={{ xs: 12, md: 2, lg: 1.5 }}>
                                                {ri === 0 && (
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={!!form[g.naKey]}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setForm((f) => ({ ...f, [g.naKey]: checked }));
                                                                    if (checked) {
                                                                        // clear errors for every field in this group (DL or Retail Lic)
                                                                        const keys = g.rows.flat().map((fld) => fld.k);
                                                                        setFieldErrors((prev) => {
                                                                            const next = { ...prev };
                                                                            keys.forEach((k) => { next[k] = ""; });
                                                                            return next;
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        }
                                                        label={g.naLabel}
                                                    />
                                                )}
                                            </Grid>
                                            {row.map((fld) => fieldConfig[fld.cfg]?.show && (
                                                <Grid size={{ xs: 12, md: 3, lg: 3.5 }} key={fld.k}>
                                                    {fld.type === "text" ? (
                                                        <TextField
                                                            label={fieldConfig[fld.cfg]?.label || fld.label}
                                                            fullWidth size="small"
                                                            disabled={!!form[g.naKey]}
                                                            required={fld.req && !form[g.naKey]}
                                                            sx={disabledBgSx}
                                                            value={form[fld.k] || ""}
                                                            onChange={(e) => {
                                                                setForm((f) => ({ ...f, [fld.k]: e.target.value.replace(/^\s+/, "") }));
                                                                setFieldErrors((prev) => ({ ...prev, [fld.k]: "" }));
                                                            }}
                                                            error={!!fieldErrors[fld.k]}
                                                            helperText={fieldErrors[fld.k]}
                                                        />
                                                    ) : (
                                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                            <DatePicker
                                                                label={fieldConfig[fld.cfg]?.label || fld.label}
                                                                value={form[fld.k] ? dayjs(form[fld.k]) : null}
                                                                onChange={(newValue) => {
                                                                    setForm((f) => ({
                                                                        ...f,
                                                                        [fld.k]: newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "",
                                                                    }));
                                                                    setFieldErrors((prev) => ({ ...prev, [fld.k]: "" }));
                                                                }}
                                                                format="DD MMM YYYY"
                                                                disabled={!!form[g.naKey]}
                                                                slotProps={{
                                                                    textField: {
                                                                        size: "small",
                                                                        fullWidth: true,
                                                                        required: fld.req && !form[g.naKey],
                                                                        error: !!fieldErrors[fld.k],
                                                                        helperText: fieldErrors[fld.k],
                                                                        sx: disabledBgSx,
                                                                    },
                                                                }}
                                                            />
                                                        </LocalizationProvider>
                                                    )}
                                                </Grid>
                                            ))}
                                        </Grid>
                                    ))}
                                </React.Fragment>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Box>
        </div>
    );
};

export default BillingInfo;