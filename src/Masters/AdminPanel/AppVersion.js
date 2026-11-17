import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import PageHeader from "../../utils/PageHeader";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  IconButton,
  FormControl,
  TextField,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../../utils/confirmDialog";
import "./AdminPanel.css";
import { MdOutlineEdit } from "react-icons/md";
import { getMasterPanel } from "../../services/masterPanelService";
import usePageTitle from "../../services/usePageTitle";

export default function AppVersion() {
  const { editappvid } = useParams();
  const decodedAppEditId =
    editappvid !== undefined && editappvid !== null
      ? Number(atob(editappvid))
      : null;
  const [tabValue, setTabValue] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allAppData, setAllAppData] = useState([]);
  const [userTypeOptions, setUserTypeOptions] = useState([]);
  const [selUserType, setSelUserType] = useState("");
  const [selOs, setSelOs] = useState(1);
  const [appVersion, setAppVersion] = useState("");
  const [appBuild, setAppBuild] = useState("");
  const [userTypeErr, setUserTypeErr] = useState(false);
  const [apptypeErr, setAppTypeErr] = useState(false);
  const [buildTypeErr, setBuildTypeErr] = useState(false);
  const [versionTypeErr, setVersionTypeErr] = useState(false);
  const [modifyLoading, setModifyLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [masterPanel, setMasterPanel] = useState({});
  const [originalData, setOriginalData] = useState({
    selUserType: "",
    selOs: 1,
    appVersion: "",
    appBuild: "",
  });
  usePageTitle(masterPanel["APVR"] || "App Version")

  useEffect(() => {
    const loadMasterPanel = async () => {
      const data = await getMasterPanel();
      setMasterPanel(data);
    };
    loadMasterPanel();
  }, []);

  useEffect(() => {
    fetchFieldUser();
    fetchAppversionData();
  }, []);

  useEffect(() => {
    if (!decodedAppEditId) {
      resetFields();
      setTabValue(1);
      return;
    }
    collectEditData(decodedAppEditId);
  }, [decodedAppEditId]);

  const fetchFieldUser = async () => {
    try {
      let response = await api.post("/fieldUsers");
      let data = Array.isArray(response.data.data) ? response.data.data : [];
      const options = data.map((item) => ({
        id: String(item.id),
        label: item.client_alias || "",
      }));
      setUserTypeOptions(options);
      if (options.length > 0) {
        setSelUserType((prev) => prev || options[0].id);
      }
    } catch (err) {
      console.log("fetch field user Err", err);
    }
  };

  const fetchAppversionData = async () => {
    setLoading(true);
    try {
      let response = await api.post("/readAppVersion");
      let appVersData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      console.log("app version Data", appVersData);
      setAllAppData(
        appVersData.map((item, index) => ({ ...item, si_no: index + 1 })),
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmColor: "primary",
  });

  const showConfirmationDialog = (config) => {
    setConfirmationDialog((prev) => ({ ...prev, ...config, open: true }));
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog((prev) => ({ ...prev, open: false, loading: false }));
  };

  const validateFields = () => {
    let isValid = true;
    setUserTypeErr(false);
    setAppTypeErr(false);
    setBuildTypeErr(false);
    setVersionTypeErr(false);
    if (!userTypeOptions.some((t) => t.id === String(selUserType))) {
      setUserTypeErr(true);
      isValid = false;
    }
    if (!selOs || selOs === 0) {
      setAppTypeErr(true);
      isValid = false;
    }
    if (!appBuild || appBuild.trim() === "") {
      setBuildTypeErr(true);
      isValid = false;
    }
    if (!appVersion || appVersion.trim() === "") {
      setVersionTypeErr(true);
      isValid = false;
    }
    return isValid;
  };

  const showSubmitConfirmation = () => {
    showConfirmationDialog({
      title: `${decodedAppEditId ? "Edit" : "Add"} ${masterPanel["APVR"] || "App Version"}`,
      message: `Are you sure you want to ${decodedAppEditId ? "Edit" : "Add"} this ${masterPanel["APVR"] || "App Version"}?`,
      confirmText: decodedAppEditId ? "Update" : "Add",
      confirmColor: "primary",
      onConfirm: () => handleSubmit(),
    });
  };

  const resetFields = () => {
    const defaultUserType = userTypeOptions[0]?.id || "";
    setAppBuild("");
    setAppVersion("");
    setSelOs(1);
    setSelUserType(defaultUserType);
    setUserTypeErr(false);
    setOriginalData({
      selUserType: defaultUserType,
      selOs: 1,
      appVersion: "",
      appBuild: "",
    });
  };

  const handleSubmit = async () => {
    setModifyLoading(true);
    try {
      let Payload = {
        user_type: selUserType,
        os_type: selOs,
        appVersion: appVersion.trim(),
        appBuild: appBuild.trim(),
      };
      console.log("App version submit", Payload);
      let response = await api.post("/appVersionCreate", Payload);
      if (response.data.success) {
        toast.success(response.data.message);
        if (decodedAppEditId) {
          fetchAppversionData();
          navigate("/masters/appversion");
        } else {
          fetchAppversionData();
          resetFields();
          setTabValue(1);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setModifyLoading(false);
      closeConfirmationDialog();
    }
  };

  const handleEdit = (id) => {
    setUserTypeErr(false);
    setAppTypeErr(false);
    setBuildTypeErr(false);
    setVersionTypeErr(false);
    navigate(`/masters/appversion/${btoa(id)}`);
  };

  const collectEditData = async (id) => {
    try {
      let response = await api.post("/editAppVersionData", { id: id });
      console.log("Edit data", response);
      let versiondata = response.data.data[0].ver_code.split(" ");
      console.log("version Data in edit", versiondata[1], versiondata[4]);
      const editVersion = versiondata[1];
      const editBuild = versiondata[4];
      const editOs = response.data.data[0].app_type;
      const editUserType = String(response.data.data[0].user_type ?? "");
      setAppVersion(editVersion);
      setAppBuild(editBuild);
      setSelOs(editOs);
      setSelUserType(editUserType);
      setOriginalData({
        selUserType: editUserType,
        selOs: editOs,
        appVersion: editVersion,
        appBuild: editBuild,
      });
      setTabValue(0);
    } catch (err) {
      console.log(err);
    }
  };

  const tableData = allAppData.map((item) => ({
    ...item,
    type_name:
      userTypeOptions.find((t) => t.id === String(item.user_type))?.label ||
      "-",
  }));

  const columns = [
    { field: "si_no", headerName: "#", filterable: true, sortable: true },
    {
      field: "type_name",
      headerName: "USER TYPE",
      filterable: true,
      sortable: true,
    },
    {
      field: "si_no",
      headerName: "OS",
      filterable: true,
      sortable: true,
      renderCell: (row) => (
        <Typography>
          {row.row.app_type === 1
            ? "Andriod"
            : row.row.app_type === 2
              ? "IOS"
              : null}
        </Typography>
      ),
    },
    {
      field: "ver_code",
      headerName: `${(masterPanel["APVR"] || "APP VERSION").toUpperCase()}`,
      filterable: true,
      sortable: true,
    },
    {
      field: "ver_name",
      headerName: "APP NAME",
      filterable: true,
      sortable: true,
    },
    {
      field: "ACTION",
      headerName: "ACTION",
      filterable: false,
      renderCell: (row) => (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 1,
          }}
        >
          <IconButton
            className="updateBtn"
            size="small"
            onClick={() => handleEdit(row.row.id)}
          >
            <MdOutlineEdit size={15} />
          </IconButton>
        </Box>
      ),
    },
  ];
  console.log("App version", appVersion);

  const isEdited = decodedAppEditId
    ? String(selUserType) !== String(originalData.selUserType) ||
      String(selOs) !== String(originalData.selOs) ||
      (appVersion || "").trim() !== (originalData.appVersion || "").trim() ||
      (appBuild || "").trim() !== (originalData.appBuild || "").trim()
    : true;

  return (
    <Layout
      breadcrumb={[
        { label: "Home", path: "/" },
        { label: "Master", path: location.pathname },
        { label: "Admin Panel", path: location.pathname },
        {
          label: masterPanel["APVR"] || "App Version",
          path: location.pathname,
        },
      ]}
    >
      <Box
        p={2}
        sx={{ borderRadius: 1 }}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <Box>
          <h1 className="mainTitle">{masterPanel["APVR"] || "App Version"}</h1>
        </Box>

        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: "6px",
            minHeight: "30vh",
            width: { lg: "60%", md: "80%", sm: "90%", xs: "90%" },
          }}
        >
          {!decodedAppEditId ? (
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, mt: 1 }}>
              <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                <Tab
                  sx={{ fontWeight: 600, fontSize: "1.1rem" }}
                  label="ADD NEW"
                />
                <Tab
                  sx={{ fontWeight: 600, fontSize: "1.1rem" }}
                  label="VIEW LIST"
                />
              </Tabs>
            </Box>
          ) : (
            <Typography
              sx={{ px: 3, mt: 3, color: "#212121", fontSize: "18px" }}
            >
              Edit {masterPanel["APVR"] || "App Version"}
            </Typography>
          )}
          {tabValue === 0 && (
            <Box
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 3,
                width: "90%",
              }}
            >
              <FormControl>
                <InputLabel id="user_type_label">User Type*</InputLabel>
                <Select
                  labelId="user_type_label"
                  label="User Type*"
                  size="small"
                  value={selUserType}
                  onChange={(e) => {
                    setSelUserType(e.target.value);
                    if (userTypeErr) setUserTypeErr(false);
                  }}
                  error={userTypeErr}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200,
                      },
                    },
                  }}
                >
                  {userTypeOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
                {userTypeErr ? (
                  <Typography className="selError">
                    User Type not Selected !
                  </Typography>
                ) : null}
              </FormControl>
              <FormControl>
                <InputLabel id="os_label">App Type*</InputLabel>
                <Select
                  labelId="os_label"
                  label="App Type*"
                  size="small"
                  value={selOs}
                  onChange={(e) => setSelOs(e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200,
                      },
                    },
                  }}
                >
                  <MenuItem value={1}>Android</MenuItem>
                  <MenuItem value={2}>IOS</MenuItem>
                </Select>
                {apptypeErr ? (
                  <Typography className="selError">
                    OS not Selected !
                  </Typography>
                ) : null}
              </FormControl>
              <FormControl>
                <TextField
                  label="Version Code"
                  value={appVersion}
                  placeholder={`${masterPanel["APVR"] || "App Version"}`}
                  size="small"
                  required
                  onChange={(e) => setAppVersion(e.target.value)}
                  error={!!versionTypeErr}
                  helperText={
                    versionTypeErr
                      ? `The ${masterPanel["APVR"] || "App Version"} field is required`
                      : ""
                  }
                />
              </FormControl>
              <FormControl>
                <TextField
                  label="Version/Build"
                  value={appBuild}
                  placeholder="Build"
                  size="small"
                  required
                  onChange={(e) => setAppBuild(e.target.value)}
                  error={!!buildTypeErr}
                  helperText={
                    buildTypeErr ? "The App Build field is required." : ""
                  }
                />
              </FormControl>
              <Button
                onClick={() => {
                  if (validateFields()) {
                    showSubmitConfirmation();
                  } else {
                    toast.error("Please Fix all mandotory fields");
                  }
                }}
                variant="contained"
                sx={{ width: "2rem", textTransform: "none", mb: 3 }}
                disabled={!!decodedAppEditId && !isEdited}
              >
                {decodedAppEditId ? "Update" : "Create"}
              </Button>
            </Box>
          )}
          {tabValue === 1 && (
            <Box sx={{ p: 0 }}>
              <DataTable
                columns={columns}
                data={tableData}
                loading={loading}
              />
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
  );
}