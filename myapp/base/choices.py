doc_type = (
    ("general", "General"),
    ("invoice", "Invoice"),
    ("order", "Order"),
)

user_type = (
    (1, "Internal"),
    (2, "Customer"),
)

task_status = (
    ("not_started", "Not started"),
    ("in_progress", "In progress"),
    ("completed", "Completed"),
)

task_priority = (("low", "Low"), ("medium", "Medium"), ("high", "High"), ("urgent", "Urgent"))

remark_type = (
    ("normal", "Normal"),
    ("rejection", "Rejection"),
)

notification_type = (("comment_mension", "Mension in comment"),)

event_group = (("others", "Others"),)

event_action = (("remark", "Remark"),)

app_label = (("user", "User"),)

mail_type = (("po_quote_reminder", "Purchase order quotation"),)

power_service_type = (
    # ("PCB Assembly","Assembly"),
    # ("PCB Fabrication","FLEXPCB"),
    ("PCB Assembly (Consigned)", "pcb assembly (consigned)"),
    ("PCB Assembly (Turnkey)", "pcb assembly (turnkey)"),
    ("PCB Assembly (Combo)", "pcb assembly (combo)"),
    ("PCB Assembly (PCB A)", "pcb assembly (pcb a)"),
    ("PCB Assembly", "pcb_assembly"),
    ("PCB Fabrication (Flex)", "pcb fabrication (flex)"),
    ("PCB Fabrication", "pcb_fabrication"),
    ("PCB Fabrication (PCB A)", "pcb fabrication (pcb a)"),
    ("Component sourcing (Turnkey)", "component sourcing (turnkey)"),
    ("Component sourcing (Combo)", "component sourcing (combo)"),
    ("PCB stencil", "pcb_stencil"),
    ("Component sourcing", "component_sourcing"),
    ("PCB Layout", "pcb_layout"),
)

CAR_status_type = (
    ("Approve", "Approved"),
    ("Reject", "Rejected"),
    ("to_be_approved", "To be approved"),
    ("To be approved", "To be approved"),
    ("Send to approve", "To be approved"),
    ("Cancel", "Cancelled"),
)

approval_for_type = (
    ("corrective_action", "Corrective action report"),
)