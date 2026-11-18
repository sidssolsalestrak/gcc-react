import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog, DialogContent, DialogContentText, DialogActions, DialogTitle,
  IconButton,
  Typography,
  TextField
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import DataTable from "../../utils/dataTable";
import Layout from "../../layout";
import { FaMobileAlt, FaEdit, FaTrash } from "react-icons/fa";
import { Download } from '../../utils/downloadExcel/Download'
import dayjs from "dayjs";
import useToast from "../../utils/useToast";
import { DownloadNoCell } from "../../utils/xlsnoCellsDownload/DownloadNoCell";
import ConfirmationDialog from "../../utils/confirmDialog";
import { getMasterPanel } from "../../services/masterPanelService";
import { jwtDecode } from 'jwt-decode'
import usePageTitle from "../../services/usePageTitle";
import { FaRegEye } from "react-icons/fa";

function UploadNewMrt(){

    let location=useLocation()
    const navigate = useNavigate();
    const params = useParams();
    const toast=useToast()
    const [masterPanel, setMasterPanel] = useState({});
    const userLabel = masterPanel["USER"] || "Users";
    const [accStat, setAccStat] = useState(null);
    const [userType,setUserType]=useState(null)
    const [doctypeoptions,setDoctypeOptions]=useState([])
    const [doctypeSel,setDoctypeSel]=useState(0)
    const [tableData,setTableData]=useState([])
    const [sesUserId,setSesUserId]=useState(null)
    const [modifyLoading, setModifyLoading] = useState(false);
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "primary",
    });

    useEffect(()=>{
     fetchCatTypeData()
     fetchDoctypeData()
    },[])


    const showConfirmationDialog = (config) => {
    setConfirmationDialog((prev) => ({ ...prev, ...config, open: true }));
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog((prev) => ({ ...prev, open: false }));
  };

  const showDeleteConfirmation = (row) => {
    showConfirmationDialog({
      title: "Confirmation",
      message: "Are you sure you want Delete Mapping?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "primary",
      onConfirm: () => handleDelete(row),
    });
  };

    const fetchCatTypeData=async()=>{
        try{
            let response=await api.post('/catData')
            let data=Array.isArray(response.data.data) ? response.data.data :[]
            setDoctypeOptions(data)
            console.log("data from doc type",data)
        }
        catch(err){
            console.log("Cat type Error", err);
        }
    }

    const fetchDoctypeData = async () => {
    try {
        const payload = {
        doc_type_id: doctypeSel,
        };

        const response = await api.post('/getdoc_type_det', payload);
        const data = Array.isArray(response.data.data) ? response.data.data : [];

        const teamData = data.map((val,i) => {
        const team = [];

        if (Number(val.med_stat) === 1) team.push('Medical Representative');
        if (Number(val.kam_stat) === 1) team.push('Key Account Manager');
        if (Number(val.mer_stat) === 1) team.push('Merchandiser');

        return {
            ...val,
            team: team.join(', '),
            sl: i + 1,
        };
        });

        setTableData(teamData); // use teamData, not data
        console.log('table data we get ', teamData);
    } catch (err) {
        console.log('Cat type Error', err);
        toast.error('something went wrong Try again!!');
    }
    };

    useEffect(() => {
          const token = localStorage.getItem("session-token");
          if (token) {
            try {
              let decoded = jwtDecode(token)
              setUserType(decoded.user_type)
              setSesUserId(decoded.user_id)
              console.log("decoded user id", decoded.user_id)
            } catch (err) {
              console.log(err)
            }
          }
    }, [])

    const columns=[
        {
           field: "sl",
           headerName: "",  
        },
        {
            field:'doc_title',
            headerName:"Title"
        },
        {
            field:'sub_name',
            headerName:"Range"
        },
        {
            field:'doc_name',
            headerName:"Type"
        },
        {
            field:'bu_name',
            headerName:"Business Unit"
        },
        {
            field:"reg_name",
            headerName:"Region"
        },
        {
            field:'team',
            headerName:"Team",
            renderCell:(params)=>(
                <Typography sx={{wordWrap:"wrap"}}>{params.row.team}</Typography>
            ),
            width:150
        },
        {
            field:"",
            headerName:"Map",
            renderCell:()=>(
                <Box ><FaRegEye color="green"  size={15}/></Box>
            )
        },
        {
            field:"",
            headerName:"Action",
            renderCell: ({ row }) => (
                    <div style={{ display: "flex", gap: 12 }}>
                       <div className="editBtn actionBtn">
                          <FaEdit
                            style={{ cursor: "pointer" }}
                            onClick={() => handleEdit(row)}
                          />
                        </div>
                      { Number(userType)===2 &&  (
                        <div className="dltBtn actionBtn">
                          <FaTrash
                            style={{ cursor: "pointer", color: "red" }}
                            onClick={() => showDeleteConfirmation(row)}
                          />
                        </div>
                      )}
                    </div>
                  ),
        }
    ]

    const handleEdit=async()=>{

    }

    const handleDelete = async (row) => {
        try {
          setModifyLoading(true)
          let payload = {
            user_id: row.user_id
          }
          let response = await api.post("/delete_edet", payload)
          if (response.data.status === 200) {
            toast.success(response.data.message)
            navigate("/detailing/add_det_mrt")
          }
          else {
            toast.error(response.data.message)
          }
    
        }
        catch (err) {
          console.log("delete Error", err)
        }
        finally {
          setModifyLoading(false)
          closeConfirmationDialog()
        }
      };

    useEffect(() => {
                    const resolveAccStat = async () => {
                      try {
                        const res = await api.post("/getAccStat", {
                          menu_url: "Users/users_list",
                        });
                
                        const stat = res.data?.data?.acc_stat;
                        if (stat !== null && stat !== undefined) {
                          localStorage.setItem("acc_stat", stat);
                          setAccStat(String(stat));
                        }
                      } catch (err) {
                        console.log(err);
                      }
                    };
                
                    resolveAccStat();
    }, []);
    

   console.log("doctype Sel",doctypeSel)
    return (
       <Layout
        breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Detailing", path: location.pathname },
            { label: "Upload Detailing", path: location.pathname },
        ]}
       >
       <Box
              p={2}
              sx={{ borderRadius: 1 }}
              display="flex"
              flexDirection="column"
              gap={2}
            >
        <Box sx={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
            <h1 className="mainTitle">Upload Detailing</h1>
            <Button size="small" variant="contained" onClick={()=>navigate('/detailing/add_new_detailing_mrt')}>Upload New Detailing</Button>
        </Box>
        <Grid
                  container
                  spacing={2}
                  sx={{
                    background: "#fff",
                    borderRadius: "10px",
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                    padding: "16px 18px",
                  }}
                >
        
        <Grid size={{ xs: 12, md: 2, lg: 2 }}>
        <FormControl fullWidth size="small">
         <InputLabel id="typelab">Type</InputLabel>
         <Select 
         value={doctypeSel} 
         label="Type"
         labelId="typelab"
         onChange={(e)=>setDoctypeSel(e.target.value)}
         >
         <MenuItem value={0}>Select Document</MenuItem>
         {doctypeoptions.map((val)=>(
            <MenuItem value={val.id} key={val.id}>{val.doc_name}</MenuItem>
         ))}
         </Select>
        </FormControl>   
        </Grid>
        </Grid>
        
       </Box>
       <Box>
        <DataTable 
        sx={{
              background: "#fff",
              borderRadius: "10px",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
            }}
        data={tableData}
        columns={columns}
        
        />
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

       </Layout> 
    )

}

export default UploadNewMrt