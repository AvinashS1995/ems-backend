const savePopupDetails = async (req, res) => {
  try {

     const {
      name, startDate, endDate, startTime, endTime,
      country, role, gender, employee, popupType, textMessage, isActive
    } = req.body;

    const newPopup = new PopupForm({
      name,
      startDate,
      endDate,
      startTime,
      endTime,
      country,
      role,
      gender,
      employee,
      popupType,
      isActive: isActive === 'true',
      textMessage,
      uploadedFile: req.file ? req.file.filename : null
    });

    await newPopup.save();

    res.status(201).json({ 
        status: 'success',
        message: 'Popup data Created Successfully!', 
        data: {
            newPopup
        } 
    });

  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

export { savePopupDetails }