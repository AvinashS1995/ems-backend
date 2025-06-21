import Sidenav from "../Models/SidenavModel.js";

const getSidenav = async (req, res) => {
  try {
    // const role = req.user.role;

    const menus = await Sidenav.find({ role: "admin" }).sort({ sequence: 1 });

    if (!menus) {
      res.status(404).json({
        status: "fail",
        message: "Menu Not available for user",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        menus,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export default getSidenav;
