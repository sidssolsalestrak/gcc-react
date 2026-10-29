import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import gccLogo from "./assets/naos-logo-white.jpg";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Avatar,
  Badge,
  useMediaQuery,
  useTheme,
  styled,
  Tooltip,
  tooltipClasses,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  ExitToApp as ExitToAppIcon,
} from "@mui/icons-material";
import adminImage from "./assets/bhoruka-cusportal-admin.png";
import ConfirmationDialog from "./utils/confirmDialog";
import { useSnackbar } from "notistack";
import SalesTrekimg from "./assets/salestrakimg.png";
import "./layout.css";
import api from "./services/api";
import { useNavigate } from "react-router-dom";
import { SiChatbot } from "react-icons/si";
import { getUserFromToken } from "./utils/getUserFromToken";
import "font-awesome/css/font-awesome.min.css";
import { MdLock } from "react-icons/md";
import { jwtDecode } from "jwt-decode";

const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#effac1",
    color: "#343a40",
    maxWidth: 200,
    fontSize: "12px",
    border: "1px solid #979a9b",
    borderRadius: "5px",
  },
}));

const getStoredDrawerState = (fallback) => {
  try {
    const stored = sessionStorage.getItem("drawerOpen");
    return stored !== null ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const Layout = ({ children, breadcrumb = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(() => getStoredDrawerState(!isMobile));
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorEl1, setAnchorEl1] = React.useState(null);
  const open = Boolean(anchorEl1);
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [profileimg, setProfileimg] = useState(null)
  const [profileName, setProfileName] = useState('')
  const fetchedProfileRef = useRef(false);
  // Dynamic menu state (from 2nd file)
  const [menuHtml, setMenuHtml] = useState("");
  const [menuUrls, setMenuUrls] = useState([]);
  const [userData, setUserData] = useState(null);

  // Fetch menu on mount
  useEffect(() => {
    fetchMenu();
    // loadChatbot();
  }, []);


  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "session-token" && e.newValue === null) {
        navigate("/Auth");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [navigate]);

  const fetchMenu = async () => {
    try {
      const res = await api.post("/getMenuDetails");
      const data = res.data;
      if (data.status === 200) {
        // let html = data.data.menudata;
        // html = html.replace(/href="(?!\/|http)([^"]+)"/g, 'href="/$1"');
        // setMenuHtml(html);

        let html = data.data.menudata;
        html = html.replace(/href="(?!\/|http)([^"]+)"/g, 'href="/$1"');
        html = html.replace(/glyphicon glyphicon-book/g, "fa fa-book");
        html = html.replace(/glyphicon glyphicon-file/g, "fa fa-file");
        // after getMenuDetails API call succeeds
        localStorage.setItem("menu_urls", JSON.stringify(res.data.data.menuurl));
        setMenuHtml(html);

        setMenuUrls(data.data.menuurl);
      }
    } catch (err) {
      console.log("Menu fetch error:", err);
    }
  };

  useEffect(() => {
    if (fetchedProfileRef.current) return;
    fetchedProfileRef.current = true;

    const token = localStorage.getItem("session-token");
    if (token) {
      try {
        let decoded = jwtDecode(token);
        let fetchUserData = async () => {
          if (decoded.user_id) {
            try {
              let res = await api.post('/getUserBasicData', { id: decoded.user_id });
              let profdata = Array.isArray(res.data.data) ? res.data.data : [];
              setProfileimg(profdata[0]?.image_upl ? `${process.env.REACT_APP_PROFILE_URL}/${profdata[0]?.image_upl}` : null);
              setProfileName(profdata[0]?.full_name ? profdata[0].full_name : '');
            } catch (err) {
              console.log(err);
              setProfileimg(null);
              setProfileName('');
            }
          }
        };
        fetchUserData();
      } catch (err) {
        console.log(err);
      }
    }
  }, []);

  // Wire up treeview toggles after menuHtml renders
  useEffect(() => {
    if (!menuHtml) return;
    const timer = setTimeout(() => {
      // Wrap bare text nodes so CSS can hide/show them
      const links = document.querySelectorAll(".php-menu a");
      links.forEach((link) => {
        link.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            const span = document.createElement("span");
            span.className = "menu-label";
            span.textContent = node.textContent;
            node.replaceWith(span);
          }
        });
        // Add tooltip so user knows what icon is on hover
        const label = link.querySelector(".menu-label");
        if (label && !link.title) {
          link.title = label.textContent.trim();
        }
      });
      const toggles = document.querySelectorAll(".treeview > a");
      toggles.forEach((el) => {
        el.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          const parent = this.parentElement;
          const isCollapsed = document.querySelector(".php-menu.collapsed");

          // If collapsed, CSS hover handles flyout — skip JS
          if (isCollapsed) return;

          // Expanded mode — normal click toggle
          parent.classList.toggle("active");
          const submenu = parent.querySelector(":scope > .treeview-menu");
          if (submenu) {
            submenu.classList.toggle("open");
          }
        };
      });
      const treeviewItems = document.querySelectorAll(".php-menu .treeview");
      treeviewItems.forEach((item) => {
        item.addEventListener("mouseenter", function () {
          const isCollapsed = document.querySelector(".php-menu.collapsed");
          if (!isCollapsed) return;
          const submenu = this.querySelector(":scope > .treeview-menu");
          if (submenu) {
            const rect = this.getBoundingClientRect();
            submenu.style.top = rect.top + "px";

            const nestedItems = submenu.querySelectorAll(".treeview");
            nestedItems.forEach((nested) => {
              nested.addEventListener("mouseenter", function () {
                const nestedMenu = this.querySelector(
                  ":scope > .treeview-menu",
                );
                if (nestedMenu) {
                  const nestedRect = this.getBoundingClientRect();
                  nestedMenu.style.top = nestedRect.top + "px";
                }
              });
            });
          }
        });
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [menuHtml, drawerOpen, isMobile]);

  // Highlight active menu item based on current path
  useEffect(() => {
    if (!menuHtml) return;
    const timer = setTimeout(() => {
      const allLinks = document.querySelectorAll(".php-menu a");

      // ✅ Step 1: Clean up ALL previous active classes at every level
      allLinks.forEach((link) => {
        link.classList.remove("menu-active");

        // Walk up and remove both parent-active and parent-active-main from ALL ancestor treeviews
        let currentEl = link.closest(".treeview");
        while (currentEl) {
          currentEl
            .querySelector(":scope > a")
            ?.classList.remove("parent-active");
          currentEl
            .querySelector(":scope > a")
            ?.classList.remove("parent-active-main"); // ✅ new
          currentEl = currentEl
            .closest(".treeview-menu")
            ?.parentElement?.closest(".treeview");
        }
      });

      // ✅ Step 2: Find the matching link and apply active classes
      allLinks.forEach((link) => {
        const onclick = link.getAttribute("onclick") || "";
        const href = link.getAttribute("href") || "";

        const urlMatch = onclick.match(
          /acc_stat_view\([^,]+,\s*[^,]+,\s*'([^']+)'\)/,
        );
        const url = urlMatch ? urlMatch[1] : href.replace(/^\//, "");

        const cleanUrl = url ? url.replace(/^\/|\/$/g, "") : "";
        const cleanPathname = location.pathname.replace(/^\/|\/$/g, "");
        const isMatch =
          cleanUrl &&
          (cleanPathname === cleanUrl ||
            cleanPathname.startsWith(`${cleanUrl}/`));

        if (isMatch) {
          // ✅ Highlight the active child link
          link.classList.add("menu-active");

          // ✅ Walk up ALL ancestor treeviews — open and mark each one
          let currentEl = link.closest(".treeview-menu")?.parentElement;
          while (currentEl && currentEl.classList.contains("treeview")) {
            currentEl.classList.add("active");
            currentEl
              .querySelector(":scope > .treeview-menu")
              ?.classList.add("open");

            // ✅ Top-level parent gets different class than sub-parents
            const isTopLevel = !currentEl.closest(".treeview-menu");
            if (isTopLevel) {
              currentEl
                .querySelector(":scope > a")
                ?.classList.add("parent-active-main");
            } else {
              currentEl
                .querySelector(":scope > a")
                ?.classList.add("parent-active");
            }

            // Move up to next ancestor
            currentEl = currentEl.closest(".treeview-menu")?.parentElement;
          }
        }
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [menuHtml, location.pathname, drawerOpen, isMobile]);

  // Global click handler used by menu items
  useEffect(() => {
    window.acc_stat_view = (acc_stat, num, url) => {
      console.log("Clicked:", acc_stat, num, url);
      localStorage.setItem("acc_stat", acc_stat);
      navigate(`/${url}`);
    };
  }, []);

  // Sync drawer with mobile breakpoint
  useEffect(() => {
    const datasubmissionURL =
      location.pathname.startsWith("/reports/sec_sales_data") ||
      location.pathname.startsWith("/reports/preview_stk_sales/");

    if (isMobile) {
      setDrawerOpen(false);
    } else if (datasubmissionURL) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(getStoredDrawerState(true));
    }
  }, [isMobile, location.pathname]);

  const handleDrawerToggle = () => {
    const newState = !drawerOpen;
    setDrawerOpen(newState);
    try {
      sessionStorage.setItem("drawerOpen", JSON.stringify(newState));
    } catch (err) {
      console.log("sessionStorage error:", err);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleClick = (event) => {
    setAnchorEl1(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl1(null);
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
      loading: false,
    });
  };

  const showLogoutConfirmation = () => {
    showConfirmationDialog({
      title: "Confirm Logout",
      message: "Are you sure you want to Logout?",
      confirmText: "Logout",
      confirmColor: "error",
      onConfirm: () => handleLogout(),
    });
  };

  const handleLogout = async () => {
    try {
      let logoutres = await api.post('/logout')
      localStorage.removeItem("session-token");

      console.log("Logout Successfully");
      enqueueSnackbar("Logout Successfully", {
        variant: "success",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });

      navigate("/login");
    } catch (err) {
      console.log(err);
      enqueueSnackbar("Something went wrong Try again!!", {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
    } finally {
      closeConfirmationDialog();
    }
  };

  useEffect(() => {
    const user = getUserFromToken();
    if (user) {
      setUserData(user);
    }
  }, []);

  console.log("userData", userData);

  const loadChatbot = () => {
    const user = getUserFromToken();

    if (!user) {
      console.log("User not found");
      return;
    }

    if (document.getElementById("chatbot-script")) {
      return;
    }

    // prevent duplicate load
    if (document.getElementById("chatbot-script")) {
      console.log("Chatbot already loaded");
      return;
    }

    const script = document.createElement("script");
    script.id = "chatbot-script";

    script.src =
      "http://ec2-13-201-74-231.ap-south-1.compute.amazonaws.com/widget/widget.js?v=11";

    script.setAttribute(
      "data-chatbot-url",
      "http://ec2-13-201-74-231.ap-south-1.compute.amazonaws.com/chatbot",
    );
    script.setAttribute("data-user-id", user.user_id);
    script.setAttribute("data-user-email", user.email || user.identity);
    script.setAttribute("data-role", user.user_type || "region_admin");
    script.setAttribute("data-dataset", user.dataset || "salestrak-camlin");
    script.setAttribute(
      "data-allowed-datasets",
      JSON.stringify(["salestrak-camlin"]),
    );
    script.setAttribute(
      "data-dataset-scope",
      JSON.stringify({ reg_name: ["South"] }),
    );

    // script.setAttribute("data-user-id", "schueco_admin");
    // script.setAttribute("data-user-email", "admin@schueco.com");
    // script.setAttribute("data-company", "schueco");
    // script.setAttribute("data-role", "admin");
    // script.setAttribute("data-dataset", "schueco-so");
    // script.setAttribute(
    //   "data-allowed-datasets",
    //   JSON.stringify(["schueco-so", "schueco-invoice"]),
    // );
    // script.setAttribute("data-dataset-scope", JSON.stringify({}));

    // script.setAttribute("data-user-id", "login_admin_1");
    // script.setAttribute("data-user-email", "admin1@test.com");
    // script.setAttribute("data-role", "gcc_admin_1");
    // script.setAttribute("data-dataset", "salestrak-gcc");

    // script.setAttribute(
    //   "data-allowed-datasets",
    //   JSON.stringify(["salestrak-gcc"]),
    // );

    // script.setAttribute("data-dataset-scope", JSON.stringify({}));

    document.body.appendChild(script);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* ── SIDEBAR DRAWER ── */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={isMobile ? drawerOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerOpen ? 190 : 50,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerOpen ? 190 : 50,
            boxSizing: "border-box",
            backgroundColor: "#1a1917",
            height: "100vh",
            position: "relative",
            overflowY: "auto",
            transition: "width 0.3s ease !important",
            "&::-webkit-scrollbar": {
              width: "8px",
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(7, 30, 123, 0.24)",
              borderRadius: "6px",
              border: "2px solid transparent",
              backgroundClip: "padding-box",
              transition: "opacity 0.3s",
              opacity: 0.5,
              alignSelf: "center",
            },
            "&:hover::-webkit-scrollbar-thumb": {
              opacity: 1,
            },
          },
        }}
      >
        {/* Logo area (kept from 1st file, commented logo preserved) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            my: 0.7,
            padding: "3px 0px 3px 0px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <Box>
            {drawerOpen ? (
              <img
                src={SalesTrekimg}
                alt="Logo"
                style={{
                  width: isMobile ? "6rem" : "8rem",
                  alignSelf: "center",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#ff6b2c",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "24px",
                }}
              >
                ST
              </Box>
            )}
          </Box>
        </Box>

        {/* Dynamic menu rendered from API HTML */}
        <Box sx={{ paddingTop: "1rem" }}>
          <div
            className={`php-menu ${!drawerOpen ? "collapsed" : ""}`}
            dangerouslySetInnerHTML={{ __html: menuHtml }}
          />
        </Box>
      </Drawer>

      {/* ── MAIN CONTENT AREA ── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          overflow: "hidden",
        }}
      >
        {/* ── APPBAR ── */}
        <AppBar
          position="static"
          sx={{
            backgroundColor: "white",
            color: "#3c4043",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            height: "56px",
            display: "flex",
            justifyContent: "center",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Toolbar
            sx={{
              minHeight: "56px !important",
              paddingLeft: isMobile ? "12px" : "16px",
              paddingRight: isMobile ? "12px" : "16px",
            }}
          >
            {/* Hamburger toggle */}
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                color: "#5f6368",
                marginRight: "16px",
                bgcolor: "#b5babf",
                borderRadius: "3px",
                padding: "4px 10px",
                "&:hover": {
                  bgcolor: "#b5babf",
                  color: "#5f6368",
                },
              }}
            >
              <MenuIcon sx={{ color: "white", fontSize: "18px" }} />
            </IconButton>

            {/* <Box sx={{ flexGrow: 1 }} /> */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flexGrow: 1,
                overflow: "hidden",
              }}
            >
              {breadcrumb.map((item, index) => {
                const isLast = index === breadcrumb.length - 1;

                return (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <Typography
                      onClick={() => {
                        if (!isLast && item.path) {
                          navigate(item.path);
                        }
                      }}
                      sx={{
                        fontSize: "13px",
                        color: isLast ? "#1A1917" : "#706E69",
                        fontWeight: isLast ? 500 : "",
                        cursor: !isLast && item.path ? "pointer" : "default",
                        whiteSpace: "nowrap",
                        "&:hover":
                          !isLast && item.path
                            ? { textDecoration: "underline" }
                            : {},
                      }}
                    >
                      {item.label}
                    </Typography>

                    {!isLast && (
                      <Typography sx={{ ml: "6px", mr: "6px", color: "#999" }}>
                        /
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: "#f1f3f4",
                padding: "6px 10px",
                borderRadius: "12px",
              }}
            >
              {/* Camlin logo */}
              <Box sx={{ display: { xs: "block", sm: "block" } }}>
                <img
                  src={gccLogo}
                  alt="camlin Logo"
                  style={{ width: isMobile ? "4rem" : "6rem" }}
                />
              </Box>

              {/* Notifications bell */}
              <IconButton
                onClick={handleClick}
                sx={{
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  padding: "6px",
                  border: "1px solid #e0e0e0",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
              >
                <Badge
                  variant="dot"
                  overlap="circular"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "#f44336",
                    },
                  }}
                >
                  <NotificationsIcon sx={{ color: "#5f6368", fontSize: 20 }} />
                </Badge>
              </IconButton>

              {/* Notifications dropdown */}
              <Menu
                id="basic-menu"
                anchorEl={anchorEl1}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
                PaperProps={{
                  sx: {
                    width: "300px",
                    height: "400px",
                    padding: "0px",
                    fontSize: "1rem",
                    color: "#212529",
                    backgroundColor: "#fff",
                    border: "1px solid rgba(0, 0, 0, 0.15)",
                    boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.175)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  },
                }}
              >
                {/* Notification items go here */}
              </Menu>

              {/* Admin icon */}
              {/* <Box sx={{ mr: { md: 10, sm: "8%", xs: "8%" } }}>
              <img src={adminImage} alt="admin_icon_image" height="22px" />
            </Box> */}

              {/* Welcome + Avatar + user menu */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "end",
                  }}
                >
                  <IconButton
                    edge="end"
                    onClick={handleMenuClick}
                    sx={{ p: 0 }}
                  >
                    <Avatar
                      sx={{
                        width: 33,
                        height: 33,
                        bgcolor: "#1c1c1c",
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: 600,
                        borderRadius: "10px",
                      }}
                      src={profileimg}
                    >

                    </Avatar>
                  </IconButton>

                  {/* User dropdown menu */}
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                      elevation: 3,
                      sx: {
                        minWidth: "200px",
                        borderRadius: "8px",
                        marginTop: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        border: "1px solid #e0e0e0",
                      },
                    }}
                  >
                    <MenuItem disabled sx={{ opacity: 1 }}>
                      <Typography variant="body1">
                        {profileName}
                      </Typography>
                    </MenuItem>
                    <MenuItem onClick={() => navigate('/change_password')}>
                      <ListItemIcon>
                        <MdLock color="#5f6368" />
                      </ListItemIcon>
                      <Typography>Change Password</Typography>
                    </MenuItem>
                    <MenuItem
                      onClick={async () => {
                        handleMenuClose();
                        showLogoutConfirmation();
                      }}
                    >
                      <ListItemIcon>
                        <ExitToAppIcon
                          sx={{ color: "#5f6368", fontSize: "1rem" }}
                        />
                      </ListItemIcon>
                      <Typography variant="body2">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* ── PAGE CONTENT ── */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: "auto",
            backgroundColor: "#F6F5F2",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ flexGrow: 1 }}>{children}</Box>

          {location.pathname.replace(/\/$/, "") === "/dashboard" && (
            <Box
              component="footer"
              sx={{
                width: "100%",
                py: 2,
                textAlign: "center",
                bgcolor: "#fff",
                color: "#000",
                fontSize: "11.2px",
              }}
            >
              Powered by Sidssol.
            </Box>
          )}
        </Box>
      </Box>

      {/* ── CONFIRMATION DIALOG ── */}
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
    </Box>
  );
};

export default Layout;
