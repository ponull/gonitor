import React from 'react';
import './App.css';
import {Route, Routes} from "react-router-dom";
import Layout from "./screen/layout/Layout";
import {Dashboard} from "./screen/dashboard/Dashboard";
import {TaskList} from "./screen/taskList/TaskList";
import {TaskInfo} from "./screen/taskInfo/TaskInfo";
import {Login} from "./screen/login/Login";

function App() {
  return (
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="admin" element={<Layout />} >
            <Route path="" element={<Dashboard />} />
            <Route path="taskList" element={<TaskList />} />
            <Route path="taskInfo/:taskId" element={<TaskInfo />} />
          </Route>
        </Routes>
      </div>
  );
}


export default App;
