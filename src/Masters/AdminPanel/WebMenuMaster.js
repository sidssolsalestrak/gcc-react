import React, { useState, useEffect, useCallback, memo } from "react";
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
  Autocomplete,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import DeleteIcon from "@mui/icons-material/Delete";
import { MdOutlineEdit } from "react-icons/md";
import ConfirmationDialog from "../../utils/confirmDialog";
import "./AdminPanel.css";
import { getMasterPanel } from "../../services/masterPanelService";
import usePageTitle from "../../services/usePageTitle";

const ROLES = [
  { value: "0", label: "All" },
  { value: "1", label: "Maker" },
  { value: "2", label: "Checker" },
  { value: "3", label: "View Only" },
];

const ROW_STYLES = {
  level1: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 1,
    py: 0.2,
    backgroundColor: "#d6e8f5",
  },
  level2: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    pl: 1,
    pr: 1,
    py: 0.2,
    ml: 3,
  },
  level3: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    pl: 7,
    pr: 1,
    py: 0.2,
  },
};

// ─── RoleDropdown (memoized, outside component) ───────────────────────────────

const RoleDropdown = memo(({ id, disabled, value, onChange }) => (
  <FormControl size="small">
    <Select
      value={value || "0"}
      onChange={(e) => onChange(id, e.target.value)}
      disabled={disabled}
      sx={{ fontSize: "12px", height: "26px", minWidth: "100px" }}
    >
      {ROLES.map((r) => (
        <MenuItem key={r.value} value={r.value} sx={{ fontSize: "12px" }}>
          {r.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
));

// ─── Level 3 Row (memoized) ───────────────────────────────────────────────────

const Level3Row = memo(
  ({ item, isChecked, roleValue, onCheck, onRoleChange }) => (
    <Box sx={ROW_STYLES.level3}>
      <Checkbox
        size="small"
        checked={!!isChecked}
        onChange={(e) => onCheck(item, e.target.checked)}
        sx={{ p: 0 }}
      />
      <Typography sx={{ flex: 1, fontSize: "13px" }}>
        {item.menu_alias}
      </Typography>
      <RoleDropdown
        id={item.id}
        disabled={false}
        value={roleValue}
        onChange={onRoleChange}
      />
    </Box>
  ),
);

// ─── Level 2 Row (memoized) ───────────────────────────────────────────────────
// Mirrors PHP: foreach($submenu as $key2) — renders L2 + its L3 children

const Level2Row = memo(
  ({
    item,
    level3Items,
    isChecked,
    roleValue,
    onCheck,
    onRoleChange,
    checkedMap,
    rolesMap,
  }) => {
    const isDisabled = item.menu_url === "#";
    return (
      <Box>
        <Box
          sx={ROW_STYLES.level2}
          backgroundColor={level3Items.length > 0 ? "#eaf4fb" : null}
        >
          <Checkbox
            size="small"
            checked={!!isChecked}
            onChange={(e) => onCheck(item, e.target.checked)}
            sx={{ p: 0 }}
          />
          <Typography sx={{ flex: 1, fontSize: "13px" }}>
            {item.menu_alias}
          </Typography>
          <RoleDropdown
            id={item.id}
            disabled={isDisabled}
            value={roleValue}
            onChange={onRoleChange}
          />
        </Box>
        {/* PHP: $submenu2 = checkNextSubMenu($key2->id) → foreach($submenu2 as $key3) */}
        {level3Items.map((l3) => (
          <Level3Row
            key={l3.id}
            item={l3}
            isChecked={checkedMap[l3.id]}
            roleValue={rolesMap[l3.id]}
            onCheck={onCheck}
            onRoleChange={onRoleChange}
          />
        ))}
      </Box>
    );
  },
);

// ─── Level 1 Row (memoized) ───────────────────────────────────────────────────
// Mirrors PHP: foreach($repData as $key) — renders L1 + its L2 children

const Level1Row = memo(
  ({
    item,
    level2Items,
    subMenuMap,
    isChecked,
    roleValue,
    onCheck,
    onRoleChange,
    checkedMap,
    rolesMap,
  }) => {
    const isDisabled = item.menu_url === "#";
    return (
      <Box>
        <Box sx={ROW_STYLES.level1}>
          <Checkbox
            size="small"
            checked={!!isChecked}
            onChange={(e) => onCheck(item, e.target.checked)}
            sx={{ p: 0 }}
          />
          <Typography sx={{ flex: 1, fontSize: "13px", fontWeight: 600 }}>
            {item.menu_alias}
          </Typography>
          <RoleDropdown
            id={item.id}
            disabled={isDisabled}
            value={roleValue}
            onChange={onRoleChange}
          />
        </Box>

        {level2Items.map((l2) => {
          const level3Items = subMenuMap[l2.id] || [];
          return (
            <Level2Row
              key={l2.id}
              item={l2}
              level3Items={level3Items}
              isChecked={checkedMap[l2.id]}
              roleValue={rolesMap[l2.id]}
              onCheck={onCheck}
              onRoleChange={onRoleChange}
              checkedMap={checkedMap}
              rolesMap={rolesMap}
            />
          );
        })}
      </Box>
    );
  },
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WebMenuMaster() {
  const { editwebmenuId } = useParams();
  const decodedWebMenuId =
    editwebmenuId !== undefined && editwebmenuId !== null
      ? Number(atob(editwebmenuId))
      : null;

  const [tabValue, setTabValue] = useState(1);
  const [allWebMenuData, setAllWebMenuData] = useState([]);
  const [userInputData, setUserInputData] = useState([]);
  const [level1Menus, setLevel1Menus] = useState([]);
  const [subMenuMap, setSubMenuMap] = useState({});
  // eslint-disable-next-line
  const [hasChildMap, setHasChildMap] = useState({});

  const [seluserInput, setSelUserInput] = useState(null);
  const [selUserName, setSelUserName] = useState("");
  const [userTypeErr, setUserTypeErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [modifyLoading, setModifyLoading] = useState(false);
  const [originalChecked, setOriginalChecked] = useState({});
  const [originalRoles, setOriginalRoles] = useState({});

  // Menu tree state
  const [checked, setChecked] = useState({});
  const [roles, setRoles] = useState({});
  const [tableDataLoading, setTableDataLoading] = useState(false);
  const [masterPanel, setMasterPanel] = useState({});
  usePageTitle("Web Menu Master")
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
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

  const showSubmitConfirmation = () => {
    showConfirmationDialog({
      title: `${decodedWebMenuId ? "Edit" : "Add"} Web Menu Master`,
      message: !decodedWebMenuId
        ? `Are you sure ? If Data for ${selUserName} exist, it will be overridden..!`
        : `Are you sure want to edit this Menu?`,
      confirmText: decodedWebMenuId ? "Update" : "Add",
      confirmColor: "primary",
      onConfirm: () => handleSubmit(),
    });
  };

  const showDeleteConfirmation = (userId) => {
    showConfirmationDialog({
      title: "Confirmation",
      message: "Are you sure you want to delete this record?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "primary",
      onConfirm: () => handleDelete(userId),
    });
  };

  useEffect(() => {
    fetchWebmenuData();
    fetchInputData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const loadMasterPanel = async () => {
      const data = await getMasterPanel();
      setMasterPanel(data);
    };
    loadMasterPanel();
  }, []);

  useEffect(() => {
    if (!decodedWebMenuId) {
      resetFields();
      setTabValue(1);
      return;
    } else {
      if (userInputData.length === 0) return;
      collectEditData(decodedWebMenuId);
    }
    // eslint-disable-next-line
  }, [decodedWebMenuId, userInputData]);

  const resetFields = () => {
    setSelUserInput(null);
    setChecked({});
    setOriginalChecked({});
    setOriginalRoles({});
  };

  const fetchWebmenuData = async () => {
    setTableDataLoading(true);
    try {
      let response = await api.post("/readWebMenuData");
      let webmenuresData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setAllWebMenuData(
        webmenuresData.map((item, index) => ({ ...item, si_no: index + 1 })),
      );
    } catch (err) {
      console.log("web menu data error", err);
    } finally {
      setTableDataLoading(false);
    }
  };

  const fetchInputData = async () => {
    try {
      let response = await api.post("/getWebMenuInputData");
      let userInputRes = Array.isArray(response.data.usrData)
        ? response.data.usrData
        : [];
      let menuDatares = Array.isArray(response.data.repData)
        ? response.data.repData
        : [];
      setUserInputData(userInputRes);

      const l1Items = menuDatares.filter((m) => Number(m.mas_id) === 0);
      setLevel1Menus(l1Items);
      await buildMenuTree(l1Items);
    } catch (err) {
      console.log("webInput data res", err);
    }
  };

  const fetchSubMenu = async (menu_id) => {
    try {
      let res = await api.post("/checkNextSubMenu", { menu_id });
      // console.log("submenu response",res.data.data)
      return Array.isArray(res.data.data) ? res.data.data : [];
    } catch (err) {
      console.log("checkNextSubMenu error", err);
      return [];
    }
  };

  const fetchHasChild = async (menu_id) => {
    try {
      let res = await api.post("/checkNextItem", { menu_id });
      // console.log("checknext item res",res.data.data)
      return Array.isArray(res.data.data) && res.data.data.length > 0;
    } catch (err) {
      console.log("checkNextItem error", err);
      return false;
    }
  };

  const buildMenuTree = async (l1Items) => {
    try {
      setTreeLoading(true);
      const newSubMenuMap = {};
      const newHasChildMap = {};
      await Promise.all(
        l1Items.map(async (l1) => {
          // checkNextSubMenu($key->id)
          const l2Items = await fetchSubMenu(l1.id);
          newSubMenuMap[l1.id] = l2Items;
          if (l2Items.length > 0) {
            await Promise.all(
              l2Items.map(async (l2) => {
                const hasChild = await fetchHasChild(l2.id);
                newHasChildMap[l2.id] = hasChild;
                const l3Items = await fetchSubMenu(l2.id);
                newSubMenuMap[l2.id] = l3Items;
              }),
            );
          }
        }),
      );

      setSubMenuMap(newSubMenuMap);
      setHasChildMap(newHasChildMap);
    } catch (err) {
      console.log("build menu tree error", err);
    } finally {
      setTreeLoading(false);
    }
  };

  const getAllDescendantIds = useCallback(
    (id) => {
      const result = [];
      const queue = [id];
      while (queue.length) {
        const cur = queue.shift();
        const kids = subMenuMap[cur] || [];
        kids.forEach((k) => {
          result.push(k.id);
          queue.push(k.id);
        });
      }
      return result;
    },
    [subMenuMap],
  );

  // ─── getAncestorIds ───────────────────────────────────────────────────────
  // Reverse lookup from subMenuMap to find all ancestor ids

  const getAncestorIds = useCallback(
    (id) => {
      const parentOf = {};
      Object.entries(subMenuMap).forEach(([parentId, children]) => {
        children.forEach((child) => {
          parentOf[child.id] = Number(parentId);
        });
      });
      const result = [];
      let cur = parentOf[id];
      while (cur !== undefined) {
        result.push(cur);
        cur = parentOf[cur];
      }
      return result;
    },
    [subMenuMap],
  );

  // ─── handleCheck ─────────────────────────────────────────────────────────

  const handleCheck = useCallback(
    (item, isCheckedVal) => {
      setChecked((prev) => {
        const next = { ...prev, [item.id]: isCheckedVal };
        getAllDescendantIds(item.id).forEach((d) => (next[d] = isCheckedVal));
        getAncestorIds(item.id).forEach((aid) => {
          next[aid] = getAllDescendantIds(aid).some((k) => next[k]);
        });
        return next;
      });
    },
    [getAllDescendantIds, getAncestorIds],
  );

  const handleRoleChange = useCallback((id, value) => {
    setRoles((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleEdit = (id) => {
    setUserTypeErr(false);
    navigate(`/masters/webMenuMaster/${btoa(id)}`);
  };

  const validateFields = () => {
    let isValid = true;
    setUserTypeErr(false);

    if (!seluserInput || seluserInput.id === "0") {
      setUserTypeErr(true);
      isValid = false;
    }
    if (!isValid) {
      toast.error("Please fix all mandatory fields");
      return;
    }
    const checkedIds = Object.keys(checked).filter((k) => checked[k]);
    if (checkedIds.length === 0) {
      toast.error("Please select atleast one menu!");
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async () => {
    try {
      setModifyLoading(true);
      let checkedIds = Object.keys(checked).filter((k) => checked[k]);
      let addPayload = {
        userType: seluserInput.id,
        menu_id: checkedIds.join(","),
        menu_sel: checkedIds.map((k) => roles[k] || "0").join(","),
      };
      await api.post("/webMenuMasterCreate", addPayload);
      toast.success("Saved successfully!");
      if (decodedWebMenuId) {
        fetchWebmenuData();
        navigate("/masters/webMenuMaster/");
      } else {
        setTabValue(1);
        fetchWebmenuData();
      }
    } catch (err) {
      console.log("submit error", err);
      toast.error("Something went wrong!");
    } finally {
      setModifyLoading(false);
      closeConfirmationDialog();
    }
  };

  const handleDelete = async (userId) => {
    setModifyLoading(true);
    try {
      let response = await api.post("/deleteWebMenuMas", { user_type: userId });
      if (response.data.success) {
        toast.success("Deleted Successfully");
        fetchWebmenuData();
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      console.log("Delete menu Error");
    } finally {
      closeConfirmationDialog();
      setModifyLoading(false);
    }
  };

  const collectEditData = async (id) => {
    try {
      // like PHP: $masData — get checked menu ids
      const masRes = await api.post("/getWebChecked", { uid: id });
      const masData = masRes.data.data[0];
      console.log("mas Data from backend", masData);
      const arr = masData?.menu_id?.split(",").map(Number) || [];

      const repRes = await api.post("/readEditWebMenuData", { usr_id: id });
      const repData = Array.isArray(repRes.data.data) ? repRes.data.data : [];
      console.log("rep data backend", repData);
      const matchedUser = userInputData.find((u) => u.id === id) || null;
      setSelUserInput(matchedUser);
      setTabValue(0);

      let chkobject = {};
      let rolesObject = {};

      repData.forEach((item) => {
        if (arr.includes(item.id)) {
          // like PHP: if(in_array($key->id, $arr))
          chkobject[item.id] = true;
          rolesObject[item.id] = String(item.acc_stat ?? "0"); // like PHP: $key->acc_stat
        }
      });

      setChecked(chkobject);
      setRoles(rolesObject);
      setOriginalChecked(chkobject);
      setOriginalRoles(rolesObject);
    } catch (err) {
      console.log(err);
    }
  };

  const columns = [
    { field: "si_no", headerName: "#", filterable: true, sortable: true },
    {
      field: "user_name",
      headerName: `${(masterPanel["USER"] || "User").toUpperCase()} TYPE`,
      filterable: true,
      sortable: true,
    },
    {
      field: "action",
      headerName: "Action",
      filterable: false,
      renderCell: (row) => (
        <>
          <IconButton
            className="updateBtn"
            size="small"
            onClick={() => handleEdit(row.row.user_type)}
          >
            <MdOutlineEdit size={15} />
          </IconButton>
          <IconButton
            className="deleteBtn"
            size="small"
            onClick={() => showDeleteConfirmation(row.row.user_type)}
          >
            <DeleteIcon size={15} />
          </IconButton>
        </>
      ),
    },
  ];

  const currentCheckedIds = Object.keys(checked)
    .filter((k) => checked[k])
    .map(Number)
    .sort((a, b) => a - b);
  const originalCheckedIds = Object.keys(originalChecked)
    .filter((k) => originalChecked[k])
    .map(Number)
    .sort((a, b) => a - b);

  const checkedIdsChanged =
    JSON.stringify(currentCheckedIds) !== JSON.stringify(originalCheckedIds);

  const rolesChanged = currentCheckedIds.some((id) => {
    const curRole = roles[id] || "0";
    const origRole = originalRoles[id] || "0";
    return curRole !== origRole;
  });

  const isEdited = decodedWebMenuId ? checkedIdsChanged || rolesChanged : true;
  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout
      breadcrumb={[
        { label: "Home", path: "/" },
        { label: "Master", path: location.pathname },
        { label: "Admin Panel", path: location.pathname },
        { label: "Web Menu Master", path: location.pathname },
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
          <h1 className="mainTitle">Web Menu Master</h1>
        </Box>

        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: "6px",
            minHeight: "30vh",
            width: { lg: "60%", md: "80%", sm: "90%", xs: "90%" },
          }}
        >
          {!decodedWebMenuId ? (
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
              Edit Menu Master
            </Typography>
          )}

          {tabValue === 0 && (
            <Box
              sx={{
                p: { lg: 3, xs: 0, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: 3,
                width: { lg: "90%", sm: "95%", xs: "100%" },
              }}
            >
              {/* User Type */}
              <Autocomplete
                options={[
                  { id: "0", client_alias: "Select User Type" },
                  ...userInputData,
                ]}
                getOptionLabel={(option) => option.client_alias || ""}
                value={seluserInput}
                readOnly={!!decodedWebMenuId}
                onChange={(e, newValue) => {
                  setSelUserInput(newValue);
                  setSelUserName(newValue?.client_alias || "");
                  setUserTypeErr(false);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${masterPanel["USER"] || "User"} Type*`}
                    size="small"
                    error={userTypeErr}
                    helperText={
                      userTypeErr
                        ? `${masterPanel["USER"] || "User"} Type not Selected !`
                        : ""
                    }
                    sx={{
                      backgroundColor: decodedWebMenuId ? "#EEEEEE" : undefined,
                    }}
                  />
                )}
              />

              {/* Menu Tree */}
              <Box>
                <Typography sx={{ mb: 1, fontWeight: 500 }}>Menu's*</Typography>

                <Box
                  sx={{ borderRadius: 1, overflow: "hidden", fontSize: "13px" }}
                >
                  {/* Tree loading state */}
                  {treeLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        py: 4,
                        gap: 1,
                      }}
                    >
                      <CircularProgress size={22} />
                      <Typography sx={{ fontSize: "13px", color: "#555" }}>
                        Loading menus...
                      </Typography>
                    </Box>
                  ) : (
                    /* Level 1 — mirrors PHP: foreach($repData as $key) */
                    level1Menus.map((l1) => {
                      const level2Items = subMenuMap[l1.id] || [];
                      return (
                        <Level1Row
                          key={l1.id}
                          item={l1}
                          level2Items={level2Items}
                          subMenuMap={subMenuMap}
                          isChecked={checked[l1.id]}
                          roleValue={roles[l1.id]}
                          onCheck={handleCheck}
                          onRoleChange={handleRoleChange}
                          checkedMap={checked}
                          rolesMap={roles}
                        />
                      );
                    })
                  )}
                </Box>
              </Box>

              {/* Submit */}
              <Box sx={{ display: "flex", ml: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (validateFields()) {
                      showSubmitConfirmation();
                    }
                  }}
                  disabled={
                    loading || treeLoading || (!!decodedWebMenuId && !isEdited)
                  }
                  sx={{
                    backgroundColor: "#1565c0",
                    mb: 3,
                    "&:hover": { backgroundColor: "#0d47a1" },
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={18} sx={{ color: "white" }} />
                  ) : decodedWebMenuId ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </Button>
              </Box>
            </Box>
          )}

          {/* ── VIEW LIST TAB ─────────────────────────────────────────── */}
          {tabValue === 1 && (
            <Box sx={{ p: 0 }}>
              <DataTable
                columns={columns}
                data={allWebMenuData}
                loading={tableDataLoading}
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
