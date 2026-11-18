import React, { useState, useEffect } from 'react'
import Layout from '../../layout'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../utils/dataTable';
import axios from "../../services/api";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useToast from "../../utils/useToast";
import ConfirmationDialog from "../../utils/confirmDialog";
import { MdOutlineEdit } from "react-icons/md";
import usePageTitle from '../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }
const menuStyle = {
  PaperProps: {
    style: {
      maxHeight: 200
    }
  }
}

// PHP: 8 => HCP, 9 => KAM
const typeOptions = [
  { value: "8", label: "HCP" },
  { value: "9", label: "KAM" },
]

// allowed: letters, numbers, underscore, hyphen, forward slash and spaces
const invalidCharsRegex = /[^a-zA-Z0-9_\-\/ ]/;
const invalidCharsGlobal = /[^a-zA-Z0-9_\-\/ ]/g;

const emptyForm = { catType: "8", catId: "", paramName: "" }

const CoachingParameter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tableData, settableData] = useState([])
  const [categories, setCategories] = useState([])
  const [value, setValue] = useState('1');
  const [loading, setLoading] = useState(true)
  const [accStat, setAccStat] = useState(null);
  /*----------form fields ---------*/
  const [formData, setFormData] = useState(emptyForm)
  /*---------- original values for edit ---------*/
  const [original, setoriginal] = useState(emptyForm)
  /*----------form validations ---------*/
  const [validation, setValidations] = useState({
    catType: "",
    catId: "",
    paramName: "",
  })

  const resetValidations = () => {
    setValidations({ catType: "", catId: "", paramName: "" })
  }

  /*---------- decode params ---------*/
  const decodedId = id ? atob(id) : null;
  usePageTitle("Coaching Parameter")

  /*---------- re usable toast ---------*/
  const showAlert = useToast();
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmColor: "primary"
  });

  const showConfirmationDialog = (config) => {
    setConfirmationDialog({
      ...confirmationDialog,
      ...config,
      open: true,
    });
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog({
      ...confirmationDialog,
      open: false,
    });
  };

  const showSubmitConfirmation = () => {
    if (!validations()) return;
    showConfirmationDialog({
      title: `${decodedId ? "Edit" : "Add"} Coaching Parameter`,
      message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
      confirmText: decodedId ? "Update" : "Add",
      confirmColor: "primary",
      onConfirm: () => !decodedId ? onSubmit() : onEdit(),
    });
  };

  const showDeleteConfirmation = (row) => {
    showConfirmationDialog({
      title: `Delete Coaching Parameter`,
      message: `Are you sure you want to delete this record?`,
      confirmText: "Yes",
      confirmColor: "primary",
      onConfirm: () => deleteParam(row),
    });
  };

  /*----------check validations ---------*/
  const validations = () => {
    let isValid = true;
    const newValidations = { catType: "", catId: "", paramName: "" }
    if (!formData.catType) {
      newValidations.catType = "The Type field is required";
      isValid = false;
    }
    if (!formData.catId) {
      newValidations.catId = "The Coaching Category field is required";
      isValid = false;
    }
    if (!formData.paramName || formData.paramName.trim() === "") {
      newValidations.paramName = "The Coaching Parameter field is required.";
      isValid = false;
    } else if (invalidCharsRegex.test(formData.paramName)) {
      newValidations.paramName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
      isValid = false;
    }
    setValidations(newValidations)
    return isValid;
  }

  /*---------- form submit ---------*/
  const onSubmit = async () => {
    try {
      let payload = {
        ch_cat_id: formData.catId,
        ch_par_name: formData.paramName,
      }
      const res = await axios.post("/addCoachingParameter", payload)
      if (res?.data?.success) {
        showAlert.success("Coaching Parameter added successfully")
        setFormData(emptyForm);
        fetchCategories("8");
        fetchTableData();
        resetValidations();
      } else {
        showAlert.error(res?.data?.message)
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        let val = error?.response?.data || "";
        showAlert.error(val?.message || "Validation failed")
      } else {
        console.error(error);
        showAlert.error("Failed to ADD Coaching Parameter")
      }
    } finally {
      closeConfirmationDialog();
    }
  }

  /*---------- form edit submit ---------*/
  const onEdit = async () => {
    try {
      let payload = {
        id: decodedId,
        ch_cat_id: formData.catId,
        ch_par_name: formData.paramName,
        hdnData: original.paramName,
      }
      const res = await axios.post("/updateCoachingParameter", payload)
      if (res?.data?.success) {
        showAlert.success("Coaching Parameter Updated successfully")
        setFormData(emptyForm);
        setValue('1')
        navigate(`/masters/parameter`)
      } else {
        showAlert.error(res?.data?.message)
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        let val = error?.response?.data || "";
        showAlert.error(val?.message || "Validation failed")
      } else {
        console.error(error);
        showAlert.error("Failed to Update Coaching Parameter")
      }
    } finally {
      closeConfirmationDialog();
      fetchTableData();
    }
  }

  /*---------- delete ---------*/
  const deleteParam = async (row) => {
    let id = row?.row?.id
    try {
      const res = await axios.post(`/deleteCoachingParameter/${id}`);
      if (res?.data?.success) {
        showAlert.success("Successfully Deleted Coaching Parameter")
        fetchTableData();
      }
    } catch (error) {
      console.error(error);
      showAlert.error("failed to delete")
    } finally {
      closeConfirmationDialog();
    }
  }

  /*----------for formdata onchange---------*/
  const formDataChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val
    }))
  }

  /*---------- type change: reload categories (PHP: getCoachingParameters) ---------*/
  const handleTypeChange = (val) => {
    setFormData((prev) => ({ ...prev, catType: val, catId: "" }))
    fetchCategories(val);
  }

  /*----------for tab change---------*/
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  /*----------table columns---------*/
  const columns = [
    {
      field: "index",
      headerName: "#",
      filterable: true,
      sortable: true,
    },
    {
      field: "user_type_label",
      headerName: "Type",
      filterable: true,
      sortable: true,
    },
    {
      field: "coaching_cat_name",
      headerName: "Coaching Category",
      filterable: true,
      sortable: true,
    },
    {
      field: "ch_par_name",
      headerName: "Parameter",
      filterable: true,
      sortable: true,
      renderCell: (row) => (
        <Box
          sx={{
            whiteSpace: "normal",       // allow line breaks
            wordBreak: "break-word",    // break long words
            overflowWrap: "anywhere",
            width: 320,                 // fixed width so the cell can't stretch the table
            lineHeight: 1.4,
            py: 0.5,
          }}
        >
          {row?.row?.ch_par_name}
        </Box>
      ),
    },
    {
      field: "",
      headerName: "Action",
      filterable: true,
      sortable: true,
      width: 100,
      renderCell: (row) => (
        <>
          {[0, 2].includes(Number(accStat)) && (
            <IconButton className='updateBtn' size="small" onClick={() => editdata(row)}>
              <MdOutlineEdit size={15} />
            </IconButton>
          )}
          {[0, 2].includes(Number(accStat)) && (
            <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row)}>
              <DeleteIcon size={15} />
            </IconButton>
          )}
        </>
      )
    },
  ]

  const editdata = (row) => {
    let encodeId = row?.row?.id
    resetValidations();
    navigate(`/masters/parameter/${btoa(encodeId)}`)
  }

  /*---------- fetch table data ---------*/
  const fetchTableData = async () => {
    try {
      setLoading(true)
      const res = await axios.post("/getCoachingParameter");
      const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
        ...row,
        index: index + 1,
        user_type_label: Number(row.user_type) === 8 ? "HCP" : "KAM",
      })) : [];
      settableData(data);
      setAccStat(res?.data?.acc_stat ?? null);
      if (res?.data?.acc_stat !== null && res?.data?.acc_stat !== undefined) {
        localStorage.setItem("acc_stat", res?.data?.acc_stat);
      }
    } catch (error) {
      console.error(error);
      settableData([]);
    } finally {
      setLoading(false)
    }
  }

  /*---------- fetch categories by type ---------*/
  const fetchCategories = async (type) => {
    try {
      const res = await axios.post("/getCoachingParamCategories", { catTypeParam: type });
      const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
      setCategories(data);
    } catch (error) {
      console.error(error);
      setCategories([]);
    }
  }

  /*---------- get data for edit ---------*/
  const getEditData = async (decodedId) => {
    try {
      const res = await axios.post("/editCoachingParameter", { id: decodedId })
      const data = res?.data?.data || [];
      if (data && data.length > 0) {
        const type = String(data[0]?.user_type || "8");
        // load categories first so the selected category exists in the dropdown
        await fetchCategories(type);
        const vals = {
          catType: type,
          catId: data[0]?.ch_cat_id ? String(data[0].ch_cat_id) : "",
          paramName: data[0]?.ch_par_name || "",
        };
        setFormData(vals);
        setoriginal(vals);
      }
    } catch (error) {
      console.error(error);
      showAlert.error("failed to edit")
    }
  }

  /*---------- Fetch table data ---------*/
  useEffect(() => {
    fetchTableData();
  }, []);

  /*---------- Handle edit params ---------*/
  useEffect(() => {
    if (!decodedId) {
      setFormData(emptyForm);
      setoriginal(emptyForm)
      resetValidations();
      fetchCategories("8");   // PHP add page: default type HCP (8)
      return;
    }
    setValue('1');
    getEditData(decodedId);
  }, [decodedId]);

  return (
    <Layout breadcrumb={[
      { label: "Home", path: "/" },
      { label: "Master", path: location.pathname },
      { label: "Coaching", path: location.pathname },
      { label: "Coaching Parameter" },
    ]}>
      <Box
        p={2}
        sx={{ borderRadius: 1 }}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <Box>
          <h1 className="mainTitle">Coaching Parameter</h1>
        </Box>
        <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '70%', md: '85%', sm: '90%', xs: '90%' } }}>
          <TabContext value={value}>
            {!decodedId ?
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={handleChange} aria-label="coaching parameter tabs">
                  <Tab sx={tabStyle} label="ADD NEW" value="1" />
                  <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                </TabList>
              </Box> :
              <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Coaching Parameter</Typography>
            }
            {/*---------------- Add section--------------- */}
            <TabPanel value="1">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel id="catType">Type</InputLabel>
                  <Select id='catType-select' label="Type" labelId="catType" variant="outlined"
                    value={formData.catType} error={!!validation.catType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    {typeOptions.map((item) => (
                      <MenuItem key={item.value} style={{ fontSize: "11px" }} value={item.value}>{item.label}</MenuItem>
                    ))}
                  </Select>
                  {validation.catType && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.catType}</span>}
                </FormControl>

                <FormControl fullWidth size="small" required>
                  <InputLabel id="catId">Coaching Category</InputLabel>
                  <Select id='catId-select' label="Coaching Category" labelId="catId" variant="outlined" MenuProps={menuStyle}
                    value={formData.catId} error={!!validation.catId}
                    onChange={(e) => formDataChange("catId", e.target.value)}
                  >
                    <MenuItem style={{ fontSize: "11px" }} value="">Select Coaching Category</MenuItem>
                    {categories?.map((item, index) => (
                      <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={String(item.id)}>{item?.coaching_cat_name}</MenuItem>
                    ))}
                  </Select>
                  {validation.catId && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.catId}</span>}
                </FormControl>

                <TextField value={formData.paramName}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(invalidCharsGlobal, "").replace(/^\s+/, "");
                    formDataChange("paramName", onlyText)
                  }}
                  required size='small' multiline minRows={5}
                  slotProps={{ htmlInput: { maxLength: 250 } }}
                  variant='outlined' label="Parameter Name" placeholder='Enter Parameter' error={!!validation.paramName}
                  helperText={validation.paramName && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.paramName}</span>} />
              </Box>
              {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained'>Create</Button>
              )}
              {(decodedId && [0, 2].includes(Number(accStat))) && (
                <Button
                  onClick={() => showSubmitConfirmation()}
                  sx={{ mt: 2, textTransform: 'none' }}
                  color="primary"
                  variant='contained'
                  disabled={
                    String(original.catType) === String(formData.catType) &&
                    String(original.catId) === String(formData.catId) &&
                    original.paramName.trim() === formData.paramName.trim()
                  }
                >
                  Update
                </Button>
              )}
            </TabPanel>
            {/*---------------- View section--------------- */}
            <TabPanel value="2" sx={{ padding: 0 }}>
              <DataTable
                columns={columns}
                data={tableData}
                loading={loading}
              />
            </TabPanel>
          </TabContext>
        </Box>
      </Box>
      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={closeConfirmationDialog}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        cancelText={confirmationDialog.cancelText}
        loading={confirmationDialog.loading}
        confirmColor={confirmationDialog.confirmColor}
      />
    </Layout>
  )
}

export default CoachingParameter