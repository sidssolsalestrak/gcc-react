import api from "../services/api";
api.defaults.withCredentials=true
export const downloadFile = async (folder, fileName) => {
  try {

    const f = btoa(folder);
    const fn = btoa(fileName);

    const url = `/download/${f}/${fn}`;
    console.log("file and folder passes to download",f,fn)
    // Call backend using axios
    const response = await api.get(url, {
      responseType: "blob", // IMPORTANT
      withCredentials:true
    });

    // Convert blob to downloadable link
    const blob = new Blob([response.data]);
    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    URL.revokeObjectURL(downloadUrl);
    link.remove();

  } catch (error) {
    console.error(" Axios download error:", error);
  }
};
