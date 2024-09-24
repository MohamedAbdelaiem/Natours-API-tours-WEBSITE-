import { login,logout } from "./login";
import { displayMap } from "./leaflet";
import { updateUserData } from "./updateSettings";
import { signup } from "./signup";



import "@babel/polyfill";

const form_el = document.querySelector(".form--login");
const form_sign=document.querySelector(".form--signup");

const email_el = document.getElementById("email");
const password_el = document.getElementById("password");
const login_btn = document.querySelector(".login");
const signup_btn = document.querySelector(".btn--signup");
const map_el = document.getElementById("map");
const logout_btn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const form_pass=document.querySelector(".form-user-password");



if (map_el) {
  const locations = JSON.parse(map_el.dataset.locations);
  displayMap(locations);
}

if (form_el) {
  form_el.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = email_el.value;
    const password = password_el.value;
    login(email, password);
  });
}

if (logout_btn) {
  logout_btn.addEventListener("click", logout);
}

if(userDataForm)
{
  userDataForm.addEventListener('submit',e=>{
    e.preventDefault();
    const form=new FormData();
    form.append('name',document.getElementById('name').value);
    form.append('email',document.getElementById('email').value);
    form.append('photo',document.getElementById('photo').files[0]);

    updateUserData(form,'data');
  });
}

if(form_sign)
{
  form_sign.addEventListener('submit',e=>{
    e.preventDefault();
    const name=document.getElementById('name').value;
    const email=document.getElementById('email').value;
    const password=document.getElementById('password').value;
    const passwordConfirm=document.getElementById('passwordConfirm').value;

    signup(name,email,password,passwordConfirm);
  });
}

if(form_pass)
{
  form_pass.addEventListener('submit',async e=>{
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent='Updating...';
    const passwordCurrent=document.getElementById('password-current').value;
    const password=document.getElementById('password').value;
    const passwordConfirm=document.getElementById('password-confirm').value;
    await updateUserData({passwordCurrent,password,passwordConfirm},'password');
    document.getElementById('password-current').value='';
    document.getElementById('password').value='';
    document.getElementById('password-confirm').value='';
  });
}


