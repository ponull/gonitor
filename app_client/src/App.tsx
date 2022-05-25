import React from 'react';
import './App.css';
import {Link, Route, Routes} from "react-router-dom";
import Layout from "./screen/layout/Layout";
import {Dashboard} from "./screen/dashboard/Dashboard";
import {TaskList} from "./screen/taskList/TaskList";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="admin" element={<Layout />} >
            <Route path="" element={<Dashboard />} />
            <Route path="taskList" element={<TaskList />} />
        </Route>
      </Routes>
    </div>
  );
}
// App.js
function Home() {
    return (
        <>
            <nav>
                <Link to="/admin">Go Admin</Link>
            </nav>
        </>
    );
}


export default App;
