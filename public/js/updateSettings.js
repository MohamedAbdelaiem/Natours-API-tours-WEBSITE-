
import { showAlert } from './alert';

// Update user data
//type is either password or data

export const updateUserData=async(data,type)=>
{
    try{
    const url=type==='password'?'/api/v1/users/updatePassword':"/api/v1/users/updateMe"
    const res=await axios({
        method:'PATCH',
        url,
        data
    });
    if(res.data.status==='success')
        showAlert('success',`${type.toUpperCase()} updated successfully!`);
    window.setTimeout(()=>{
        location.reload();
    },1500);
}
catch(err)
{
    showAlert('error',err.response.data.message);
}
};
