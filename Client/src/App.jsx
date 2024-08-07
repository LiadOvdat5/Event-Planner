import { Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import PersistLogin from "./components/PersistLogin";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import GuestList from "./pages/GuestList";
import TaskList from "./pages/TaskList";
import MyEvents from "./pages/MyEvents";
import Header from "./components/Header";
import Layout from "./components/Layout";
import Admin from "./pages/Admin";
import Account from "./pages/Account";
import EventVendors from "./pages/EventVendors";
import { roles } from "./constants";

function App() {
  return (
    <div className="bg-gradient-to-b from-indigo-300 to-transparent">
      <Header />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="unauthorized" element={<h1>Unauthorized</h1>} />

          {/* private routes - Event Planner, Vendor & Admin */}
          <Route element={<PersistLogin />}>
            {/* All */}
            <Route element={<RequireAuth allowedRoles={roles} />}>
              <Route path="createEvent" element={<CreateEvent />} />
              <Route path="account" element={<Account />} />
              <Route path="eventDetails" element={<EventDetails />} />
              <Route path="guestList" element={<GuestList />} />
              <Route path="taskList" element={<TaskList />} />
              <Route path="myEvents" element={<MyEvents />} />
              <Route path="eventVendors" element={<EventVendors />} />
            </Route>

            {/* Admin */}
            <Route element={<RequireAuth allowedRoles={[roles[0]]} />}>
              <Route path="admin" element={<Admin />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
