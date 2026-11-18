import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
  TextField,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import DataTable from "../../utils/dataTable";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import DeleteIcon from "@mui/icons-material/Delete";
import { MdOutlineEdit } from "react-icons/md";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../../utils/PageHeader";
import ConfirmationDialog from "../../utils/confirmDialog";
import { useSnackbar } from "notistack";
import { getMasterPanel } from "../../services/masterPanelService";
import usePageTitle from '../../services/usePageTitle'


export default function Zone() {
  const [zoneName, setZoneName] = useState("");
  const [hdnZoneName, setHdnZoneName] = useState("");
  const [zoneError, setZoneError] = useState(false);
  const [accStat, setAccStat] = useState(null);
  const [zoneErrorMsg, setZoneErrorMsg] = useState("");
  const [zoneList, setZoneList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modifyLoading, setModifyLoading] = useState(false);
  const [tabValue, setTabValue] = useState(1);
  const { editZoneid } = useParams();
  const decodedEditZoneid =
    editZoneid !== undefined && editZoneid !== null
      ? Number(atob(editZoneid))
      : null;
  const toast = useToast()
  const navigate = useNavigate();
  const location = useLocation()
  const [masterPanel, setMasterPanel] = useState({});
  usePageTitle(`${masterPanel["ZONE"] || "Zone"}`)

  useEffect(() => {
    const loadMasterPanel = async () => {
      const data = await getMasterPanel();
      setMasterPanel(data);
    };
    loadMasterPanel();
  }, []);

  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmColor: "primary",
  });

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    if (!decodedEditZoneid) {
      setZoneName("");
      setHdnZoneName("");
      setZoneError(false);
      setEditId(null)
      setTabValue(1);
      return;
    }
    collectEditData(decodedEditZoneid);
  }, [decodedEditZoneid]);

  const fetchZones = async () => {
    try {
      let response = await api.post("/read_zone", { zone_id: null });
      const dataWithSiNo = response.data.data.map((item, index) => ({
        ...item,
        si_no: index + 1,
      }));
      setZoneList(dataWithSiNo);
      setAccStat(response?.data?.acc_stat?? null);
      if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
        localStorage.setItem("acc_stat", response?.data?.acc_stat);
      }
    } catch (err) {
      console.log("fetchZones error", err);
    } finally {
      setLoading(false);
    }
  };

  const validateZone = () => {
    const label = masterPanel["ZONE"] || "Zone";
    if (!zoneName || zoneName.trim() === "") {
      setZoneError(true);
      setZoneErrorMsg(`The ${label}  field is required`);
      return false;
    }
    const specialChar = /[^a-zA-Z0-9_\-\/ ]/;
    if (specialChar.test(zoneName)) {
      setZoneError(true);
      setZoneErrorMsg("Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed");
      return false;
    }
    return true;
  };

  const handleAddZone = async () => {
    try {
      setModifyLoading(true);
      setZoneError(false);

      if (decodedEditZoneid) {
        let check =
          hdnZoneName.toLowerCase().trim() === zoneName.toLowerCase().trim() ? 0 : 1;
        let response = await api.post("/updateZone", {
          id: editId,
          newZone: zoneName.trim(),
          check: check,
        });
        if (response.data.success) {
          toast.success(response.data.message)
          fetchZones();
          navigate("/masters/zone_mas");
        } else {
          toast.error(response.data.message)
        }
      } else {
        let response = await api.post("/addZone", { newZone: zoneName.trim() });
        if (response.data.success) {
          toast.success(response.data.message)
          setZoneName("");
          fetchZones();
          setTabValue(1);
        } else {
          toast.error(response.data.message)
        }
      }
    } catch (err) {
      console.log("addzone error", err);
      toast.error("Something went wrong Try again!!")
    } finally {
      setModifyLoading(false);
      closeConfirmationDialog();
    }
  };

  const collectEditData = async (zoneid) => {
    try {
      let response = await api.post("/read_zone", { zone_id: zoneid });
      let data = response.data.data[0];
      setEditId(zoneid);
      setZoneName(data.zone_name);
      setHdnZoneName(data.zone_name);
      setZoneError(false);
      setTabValue(0);
      setAccStat(response?.data?.acc_stat?? null);
      if (response?.data?.acc_stat !== null && response?.data?.acc_stat !== undefined) {
        localStorage.setItem("acc_stat", response?.data?.acc_stat);
      }
    } catch (err) {
      console.log(err);
    }
  };
  console.log("accStat in zone",accStat)

  const handleEdit = (zoneId) => {
    navigate(`/masters/zone_mas/${btoa(zoneId)}`);
  };

  const showConfirmationDialog = (config) => {
    setConfirmationDialog((prev) => ({ ...prev, ...config, open: true }));
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog((prev) => ({ ...prev, open: false }));
  };

const showSubmitConfirmation = () => {
    const label = masterPanel["ZONE"] || "Zone";
    showConfirmationDialog({
      title: `${decodedEditZoneid ? "Edit" : "Add"} ${label}`,
      message: `Are you sure you want to ${decodedEditZoneid ? "Edit" : "Add"} this ${label}?`,
      confirmText: decodedEditZoneid ? "Update" : "Add",
      confirmColor: "primary",
      onConfirm: () => handleAddZone(),
    });
};

  const showDeleteConfirmation = (id) => {
    showConfirmationDialog({
      title: "Confirmation",
      message: "Are you sure you want to delete this record?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "primary",
      onConfirm: () => handleDelete(id),
    });
  };

  const handleDelete = async (id) => {
    setModifyLoading(true);
    try {
      let response = await api.post("/deleteZone", { id });
      if (response.data.code === 1) {
        toast.success(response.data.message)
      } else {
        toast.error(response.data.message)
      }
      fetchZones();
    } catch (err) {
      console.log("deleteZone error", err);
      toast.error("Something went wrong Try again!!")
    } finally {
      closeConfirmationDialog();
      setModifyLoading(false);
    }
  };

  const columns = [
    { field: "si_no", headerName: "#", filterable: true, sortable: true },
    {
      field: "zone_name",
       headerName: `${masterPanel["ZONE"] || "Zone"} Name`,
      filterable: true,
      sortable: true,
    },
    {
      field: "action",
      headerName: "Action",
      filterable: false,
      renderCell: (row) => (
        <>
          {[0, 2].includes(Number(accStat)) &&
            <IconButton className='updateBtn' size="small" onClick={() => handleEdit(row.row.id)}>
              <MdOutlineEdit size={15} />
            </IconButton>
          }
          {[0, 2].includes(Number(accStat)) &&
            <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row.row.id)}>
              <DeleteIcon size={15} />
            </IconButton>
          }
        </>
      ),
    },
  ];

  return (
    <Layout breadcrumb={[
      { label: "Home", path: "/" },
      { label: "Master", path: "/masters/zone_mas" },
      { label: " Geographical", path: "/masters/zone_mas" },
      { label: masterPanel["ZONE"] ? `${masterPanel["ZONE"]}` : "Zone", path: location.pathname },
    ]}>
      <Box
        p={2}
        sx={{ borderRadius: 1 }}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <Box>
          <h1 className="mainTitle">{masterPanel["ZONE"] || "Zone"}</h1>
        </Box>
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: "6px",
            minHeight: "30vh",
            width: { lg: "60%", md: "80%", sm: "90%", xs: "90%" },
          }}
        >
          {!decodedEditZoneid ? (
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
            <Typography sx={{ px: 3, mt: 3, color: "#212121", fontSize: "18px" }}>
              Edit {masterPanel["ZONE"] || "Zone"} Details
            </Typography>
          )}

          {tabValue === 0 && (
            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
               label={`${masterPanel["ZONE"] || "Zone"} Name`}
                value={zoneName}
                required
                type="text"
                onChange={(e) => {
                  const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                  setZoneName(onlyText);
                  if (zoneError) setZoneError(false);
                }}
                size="small"
                error={!!zoneError}
                helperText={zoneError ? zoneErrorMsg : ""}
              />
              {(!editId && [0, 1, 2].includes(Number(accStat))) && (
                <Button
                  sx={{ ml: 1, width: "2rem",textTransform:'none' }}
                  variant="contained"
                  onClick={() => {
                    if (validateZone()) {
                      showSubmitConfirmation();
                    } else {
                      toast.error("Please fix all mandatory fields")
                    }
                  }}
                >
                  Create
                </Button>)}
              {(editId && [0, 2].includes(Number(accStat))) && (<Button
                sx={{ ml: 1, width: "2rem",textTransform:'none' }}
                variant="contained"
                disabled={hdnZoneName.toLowerCase().trim() === zoneName.toLowerCase().trim()}
                onClick={() => {
                  if (validateZone()) {
                    showSubmitConfirmation();
                  } else {
                    toast.error("Please fix all mandatory fields")
                  }
                }}
              >
                Update
              </Button>)}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <DataTable columns={columns} data={zoneList} loading={loading} />
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