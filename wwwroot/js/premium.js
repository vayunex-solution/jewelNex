document.addEventListener('DOMContentLoaded', () => {
    // Helper to get element safely
    const el = (id) => document.getElementById(id);

    const itemsTableBody = el('invoice-items');
    const addRowBtn = el('add-row-btn');
    const saveBtn = el('save-invoice-btn');
    const dateInput = el('invoice-date');
    const gstInput = el('gst-rate-input');
    const paidInput = el('paid-amount');
    const typeSelect = el('invoice-type');
    
    console.log("Invoice System Loading...");

    let masterItems = [];
    let masterCustomers = [];
    let shopSettings = null;

    // Initialize listeners
    if (addRowBtn) {
        addRowBtn.onclick = (e) => {
            if (e) e.preventDefault();
            window.addRow();
        };
    }

    if (gstInput) gstInput.oninput = calculateInvoice;
    if (el('daily-rate')) el('daily-rate').oninput = calculateInvoice;
    if (el('gst-type-select')) el('gst-type-select').onchange = calculateInvoice;
    if (el('discount-input')) el('discount-input').oninput = calculateInvoice;
    if (paidInput) paidInput.oninput = updateOutstanding;
    if (typeSelect) typeSelect.onchange = fetchNextNumber;

    async function fetchNextNumber() {
        if (!typeSelect) return;
        try {
            const type = typeSelect.value;
            const res = await fetch(`/Invoices/GetNextInvoiceNumber?type=${encodeURIComponent(type)}`);
            if (res.ok) {
                const num = await res.text();
                if (el('invoice-no')) el('invoice-no').value = num;
            }
        } catch (err) {
            console.error("Next number fetch failed:", err);
        }
    }

    // Fetch Master Data on Load
    async function loadMasterData() {
        try {
            const [itemRes, custRes, settingsRes] = await Promise.all([
                fetch('/ItemMaster/GetAllItems'),
                fetch('/Customers/GetAllCustomers'),
                fetch('/Settings/GetSettings')
            ]);
            
            if (itemRes.ok) masterItems = await itemRes.json();
            if (custRes.ok) masterCustomers = await custRes.json();
            if (settingsRes.ok) shopSettings = await settingsRes.json();

            // Populate Customer Dropdown
            const custSelect = el('cust-name-select');
            if (custSelect) {
                const options = Array.from(custSelect.options);
                options.forEach(opt => { if(opt.value && opt.value !== 'custom') opt.remove(); });
                
                masterCustomers.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.name;
                    custSelect.insertBefore(opt, custSelect.options[custSelect.options.length-1]);
                });
            }
            return true;
        } catch (err) {
            console.error("Failed to load master data:", err);
        }
        return false;
    }

    // Customer Selection Logic
    const custSelect = el('cust-name-select');
    const newCustContainer = el('new-cust-fields');
    if (custSelect) {
        custSelect.onchange = () => {
            const val = custSelect.value;
            const nameInput = el('cust-name');
            const mobileInput = el('cust-mobile');
            const gstinInput = el('cust-gstin');
            const addressInput = el('cust-address');
            const gstTypeSelect = el('gst-type-select');

            // Helper to set readonly state
            const setType = (isReadOnly) => {
                [nameInput, mobileInput, gstinInput, addressInput].forEach(i => {
                    if (i) i.readOnly = isReadOnly;
                });
            };

            if (val === "custom") {
                if (newCustContainer) newCustContainer.style.display = "block";
                setType(false);
                if (nameInput) nameInput.value = "";
                if (mobileInput) mobileInput.value = "";
                if (gstinInput) gstinInput.value = "";
                if (addressInput) addressInput.value = "";
                if (el('cust-opening-bal')) el('cust-opening-bal').value = "0";
                if (el('cust-bal-type')) el('cust-bal-type').value = "1";
            } else if (val) {
                if (newCustContainer) newCustContainer.style.display = "block";
                setType(true);
                const selected = masterCustomers.find(c => c.id == val);
                if (selected) {
                    if (nameInput) nameInput.value = selected.name || "";
                    if (mobileInput) mobileInput.value = selected.mobile || "";
                    if (gstinInput) gstinInput.value = selected.gstin || "";
                    if (addressInput) addressInput.value = selected.address || "";
                    if (el('cust-opening-bal')) el('cust-opening-bal').value = selected.openingBalance || 0;
                    if (el('cust-bal-type')) el('cust-bal-type').value = selected.balanceType || 1;

                    // AUTO GST
                    if (gstTypeSelect && shopSettings && selected.stateCode) {
                        gstTypeSelect.value = (shopSettings.stateCode === selected.stateCode) ? "intra" : "inter";
                        calculateInvoice();
                    }
                }
            } else {
                if (newCustContainer) newCustContainer.style.display = "none";
            }
        };
    }

    // Add Row Logic
    window.addRow = function() {
        if (!itemsTableBody) return;
        
        try {
            const rowCount = itemsTableBody.children.length + 1;
            const row = document.createElement('tr');
            
            let optionsHtml = masterItems.map(item => 
                `<option value="${item.name}">${item.name} (${item.purity || ''} - Stock: ${item.stockQuantity || 0})</option>`
            ).join('');

            row.innerHTML = `
                <td>
                    <select class="ri-select">
                        <option value="I" selected>I</option>
                        <option value="R">R</option>
                    </select>
                </td>
                <td>
                    <div class="item-select-container">
                        <select class="item-name-select">
                            <option value="">-- Select Item --</option>
                            ${optionsHtml}
                            <option value="custom">Other (Manual Entry)</option>
                        </select>
                        <input type="text" class="item-name custom-name" placeholder="Enter Product Name" style="display:none; margin-top:8px;">
                    </div>
                </td>
                <td><input type="number" class="gross-wt" step="0.001" value="0.000"></td>
                <td><input type="number" class="purity-val" step="0.01" value="0.00" placeholder="Purity"></td>
                <td><input type="number" class="making" step="0.01" value="0.00"></td>
                <td><input type="number" class="fine-wt" step="0.001" value="0.000" readonly tabindex="-1"></td>
                <td style="text-align: right;"><strong class="item-amount">₹ 0.00</strong></td>
                <td><button type="button" class="btn-remove" title="Remove"><i class="fas fa-trash"></i></button></td>
            `;

            const select = row.querySelector('.item-name-select');
            const nameInput = row.querySelector('.item-name');
            const purityInput = row.querySelector('.purity-val');

            select.onchange = () => {
                const val = select.value;
                if (val === "custom") {
                    nameInput.style.display = "block";
                    nameInput.value = "";
                } else {
                    nameInput.style.display = "none";
                    nameInput.value = val;
                    const itemInfo = masterItems.find(i => i.name === val);
                    if (itemInfo) {
                        purityInput.value = itemInfo.purity || "";
                        if ((itemInfo.stockQuantity || 0) <= 0) alert("⚠️ Warning: Out of Stock!");
                        calculateInvoice();
                    }
                }
            };

            const riSelect = row.querySelector('.ri-select');
            riSelect.onchange = calculateInvoice;

            row.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', calculateInvoice);
            });

            row.querySelector('.btn-remove').onclick = () => {
                row.remove();
                calculateInvoice();
            };

            itemsTableBody.appendChild(row);
            calculateInvoice();
        } catch (err) {
            console.error("Error adding row:", err);
        }
    }

    function updateRowNumbers() {
        const rows = itemsTableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const numEl = row.querySelector('.row-number');
            if (numEl) numEl.textContent = index + 1;
        });
    }

    function calculateInvoice() {
        if (!itemsTableBody) return;
        let goldValTotal = 0;
        let makingTotal = 0;
        const dailyRate = parseFloat(el('daily-rate')?.value) || 0;
        
        const rows = itemsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const ri = row.querySelector('.ri-select')?.value || 'I';
            const gWt = parseFloat(row.querySelector('.gross-wt')?.value) || 0;
            const purity = parseFloat(row.querySelector('.purity-val')?.value) || 0;
            const mk = parseFloat(row.querySelector('.making')?.value) || 0;
            
            // Calculate Fine Weight: gWt * (purity / 100)
            const fWt = gWt * (purity / 100);
            const fineWtInput = row.querySelector('.fine-wt');
            if (fineWtInput) fineWtInput.value = fWt.toFixed(3);

            // Calculate Amount: FineWt * DailyRate + Making
            const goldVal = fWt * dailyRate;
            let totalRow = goldVal + mk;
            
            // If Receipt (R), amount is negative (customer giving back)
            if (ri === 'R') {
                totalRow = -totalRow;
                goldValTotal += -goldVal;
                makingTotal += -mk;
            } else {
                goldValTotal += goldVal;
                makingTotal += mk;
            }
            
            const amtEl = row.querySelector('.item-amount');
            if (amtEl) {
                const prefix = totalRow < 0 ? "- ₹ " : "₹ ";
                amtEl.textContent = `${prefix}${Math.abs(totalRow).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                if (totalRow < 0) amtEl.style.color = "#d9534f"; // Red for receipt
                else amtEl.style.color = "var(--primary-gold-dark)";
            }
        });

        const subTotalVal = goldValTotal + makingTotal;
        const totalGstRate = parseFloat(el('gst-rate-input')?.value) || 0;
        const gstType = el('gst-type-select')?.value || 'intra';
        
        let cgstVal = 0, sgstVal = 0, igstVal = 0;

        if (gstType === 'intra') {
            const halfRate = totalGstRate / 2;
            cgstVal = subTotalVal * (halfRate / 100);
            sgstVal = subTotalVal * (halfRate / 100);
            
            if (el('cgst-sgst-rows')) el('cgst-sgst-rows').style.display = 'block';
            if (el('igst-row')) el('igst-row').style.display = 'none';
            
            const labelCGST = el('label-cgst');
            const labelSGST = el('label-sgst');
            if (labelCGST) labelCGST.textContent = `CGST (${halfRate}%):`;
            if (labelSGST) labelSGST.textContent = `SGST (${halfRate}%):`;
        } else {
            igstVal = subTotalVal * (totalGstRate / 100);
            
            if (el('cgst-sgst-rows')) el('cgst-sgst-rows').style.display = 'none';
            if (el('igst-row')) el('igst-row').style.display = 'block';
            
            const labelIGST = el('label-igst');
            if (labelIGST) labelIGST.textContent = `IGST (${totalGstRate}%):`;
        }

        const discountVal = parseFloat(el('discount-input')?.value) || 0;
        const totalWithGst = (subTotalVal + cgstVal + sgstVal + igstVal) - discountVal;
        const roundedTotal = Math.round(totalWithGst);
        const roundOffVal = roundedTotal - totalWithGst;

        const setTxt = (id, val) => {
            const target = el(id);
            if (target) target.textContent = `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        };

        setTxt('break-gold-value', goldValTotal);
        setTxt('break-making-charges', makingTotal);
        setTxt('break-sub-total', subTotalVal);
        setTxt('break-cgst', cgstVal);
        setTxt('break-sgst', sgstVal);
        setTxt('break-igst', igstVal);
        setTxt('break-total-amount', roundedTotal);
        
        const rEl = el('break-rounded');
        if (rEl) rEl.textContent = `₹ ${roundOffVal.toFixed(2)}`;
        
        updateOutstanding();
    }

    function updateOutstanding() {
        const totalText = el('break-total-amount')?.innerText || "0";
        const total = parseFloat(totalText.replace(/[^0-9.-]+/g, "")) || 0;
        const paid = parseFloat(el('paid-amount')?.value) || 0;
        const balance = total - paid;
        const bEl = el('outstanding-balance');
        if (bEl) bEl.textContent = `₹ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            try {
                const getTxtVal = (id) => parseFloat(el(id)?.innerText.replace(/[^0-9.-]+/g, "")) || 0;
                const custIdVal = el('cust-name-select')?.value;
                const isNewCust = custIdVal === 'custom' || !custIdVal;
                
                const invoiceData = {
                    InvoiceType: el('invoice-type')?.value || "Tax Invoice",
                    InvoiceNo: el('invoice-no')?.value || "",
                    Date: el('invoice-date')?.value || "",
                    PaymentMode: document.querySelector('input[name="payment-mode"]:checked')?.value || "Cash",
                    PaidAmount: parseFloat(el('paid-amount')?.value) || 0,
                    GstRate: parseFloat(el('gst-rate-input')?.value) || 0,
                    Discount: parseFloat(el('discount-input')?.value) || 0,
                    Remarks: el('remarks')?.value || "",
                    CustomerId: isNewCust ? 0 : parseInt(custIdVal),
                    Customer: isNewCust ? {
                        Name: el('cust-name')?.value || "",
                        Mobile: el('cust-mobile')?.value || "",
                        GSTIN: el('cust-gstin')?.value || "",
                        Address: el('cust-address')?.value || "",
                        OpeningBalance: parseFloat(el('cust-opening-bal')?.value) || 0,
                        BalanceType: parseInt(el('cust-bal-type')?.value) || 1
                    } : null,
                    Items: [],
                    GoldValueTotal: getTxtVal('break-gold-value'),
                    MakingChargesTotal: getTxtVal('break-making-charges'),
                    SubTotal: getTxtVal('break-sub-total'),
                    CGST: getTxtVal('break-cgst'),
                    SGST: getTxtVal('break-sgst'),
                    IGST: getTxtVal('break-igst'),
                    TotalAmount: getTxtVal('break-total-amount'),
                    RoundedOff: parseFloat(el('break-rounded')?.innerText.replace(/[^0-9.-]+/g, "")) || 0
                };

                const rows = itemsTableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    const rowAmt = parseFloat(row.querySelector('.item-amount')?.innerText.replace(/[^0-9.-]+/g, "")) || 0;
                    const gWt = parseFloat(row.querySelector('.gross-wt')?.value) || 0;
                    invoiceData.Items.push({
                        ItemName: row.querySelector('.item-name')?.value || "",
                        RI: row.querySelector('.ri-select')?.value || "I",
                        Purity: row.querySelector('.purity-val')?.value || "",
                        GrossWt: gWt,
                        NetWt: gWt, 
                        FineWt: parseFloat(row.querySelector('.fine-wt')?.value) || 0,
                        Rate: parseFloat(el('daily-rate')?.value) || 0,
                        MakingCharges: parseFloat(row.querySelector('.making')?.value) || 0,
                        Amount: rowAmt
                    });
                });

                const response = await fetch('/Invoices/Create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });

                if (response.ok) {
                    alert("✨ Invoice Saved!");
                    window.print();
                    window.location.href = '/Invoices';
                } else {
                    const errorMsg = await response.text();
                    alert("Error saving invoice: " + errorMsg);
                }
            } catch (err) { 
                console.error(err); 
                alert("Save failed: " + err.message); 
            }
        };
    }

    // Run initialization
    (async () => {
        if (dateInput) dateInput.valueAsDate = new Date();
        await loadMasterData();
        await fetchNextNumber();
        if (itemsTableBody && itemsTableBody.children.length === 0) window.addRow();
    })();
});
