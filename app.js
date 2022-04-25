//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const lodash = require("lodash");
const ejs = require("ejs");
const { lowerCase } = require("lodash");
const nodemailer = require("nodemailer");
const multiparty = require("multiparty");
//require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/blogDB");

const blogSchema = mongoose.Schema({
  _id : {
    type : Number
  },
  title : {
    required : true,
    type : String
  },
  content : {
    required : true,
    type : String
  }
});

const Blog = mongoose.model("Blog", blogSchema);

const homeStartingContent = "This is a Blog site where we can compose posts.";
const aboutContent = "This is a small Blog writing site. Tech stack use din this project is Nodejs, HTML, CSS, Mongodb";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let posts = [];

app.get("/", (req, res)=>{
  Blog.find({}, (err, foundBlogs)=>{
    res.render("home", {homeStarting : homeStartingContent, posts : foundBlogs});
  });
  
});

app.get("/about", (req, res)=>{
  res.render("about", {aboutContent: aboutContent});
})

app.get("/contact", (req, res)=>{
  res.render("contact", {contactContent : aboutContent});
})

app.get("/compose", (req, res)=>{
  res.render("compose");
})

app.get("/submit", (req, res)=>{
  res.render("submit");
})

app.post("/compose", (req, res)=>{

  const newBlog = new Blog({
    _id : req.body.postID,
    title :req.body.postTitle,
    content : req.body.postBody
  });
  newBlog.save();
  posts.push(newBlog);
  res.redirect("/");
})


app.get("/posts/:postId", (req, res)=>{

  const blog_id = lodash.capitalize(req.params.postId);
  
  Blog.findOne({_id : blog_id}, (err, result)=>{
    if(err)
    {
        console.log("This blog does not exist");
    }
    else
    {
      
      res.render("post", {id : result._id, title : result.title, content : result.content});
    }
  });

});

app.post("/delete", (req, res)=>{
  const blogID = req.body.deletedID;
  Blog.deleteOne({_id : blogID}, (err)=>{
    if(err)
      console.log("Can't delete");
    res.redirect("/");
      
  })

});

app.post("/save", (req, res)=>{
  const blogId = req.body.postID;
  const title = req.body.postTitle;
  const content = req.body.postBody;
  console.log(blogId + " " + title);
  Blog.deleteOne({_id : blogId}, (err)=>{
    if(err)
      console.log("say it");
  });
  Blog.find((err, ans)=>{
    if(!err)
    {
      ans.forEach((b)=>{
        console.log(b.title);
        console.log(b._id);
      });
    }
  });
  const newBlog = new Blog({
    _id : blogId,
    title : title,
    content : content
  });
  newBlog.save();
  posts.push(newBlog);
  res.redirect("/");
});

app.post("/update", (req, res)=>{
  const blogId = req.body.updatedID;
  Blog.findOne({_id : blogId}, (err, result)=>{
    if(err)
      console.log("Can't find");
    else
    {
      res.render("edit", {
        id : blogId,
        title: result.title,
        content: result.content
      });
    }
  });
  
});

const user = "***@gmail.com";
const password = "*********";

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: user,
    pass: password,
  },
});

// verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

app.post("/send", (req, res) => {
  console.log("kjjgjj");
  let form = new multiparty.Form();
  let data = {};
  form.parse(req, function (err, fields) {
    Object.keys(fields).forEach(function (property) {
      data[property] = fields[property].toString();
    });
    console.log(data);
    const mail = {
      sender: `${data.name} <${data.email}>`,
      to: user, // receiver email,
      subject: data.subject,
      text: `${data.name} <${data.email}> \n${data.message}`,
    };
    transporter.sendMail(mail, (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).send("Something went wrong.");
      } else {
        res.status(200).redirect("/submit");
      }
    });
  });
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});

