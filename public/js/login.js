
import { showAlert } from "./alert";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });
    if (res.data.status === "success") {
      showAlert("success","Logged in successfully!");
      window.setTimeout(() => {
        location.assign("/me");
      }, 1500);
    }
  } catch (err) {
    showAlert("error",err.response?.data?.message || "An error occurred");
  }
};

export const logout=async()=>{
    try{
        const res=await axios({
            method:'GET',
            url:'/api/v1/users/logout'
        });
        if(res.data.status==='success'){
          if ((res.data.status = 'success')) window.location.replace('/');
        }
    }catch(err){
         console.log(err.response);
        showAlert('error','Error logging out! Try again');
    }
};

// Handle form submission
