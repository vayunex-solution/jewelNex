document.addEventListener('DOMContentLoaded', () => {
    // Helper to get element safely
    const el = (id) => document.getElementById(id);

    const itemsTableBody = el('invoice-items');
    const addRowBtn = el('add-row-btn');
    const saveBtn = el('save-invoice-btn');
    const dateInput = el('invoice-date');
    const gstInput = el('gst-rate-input');
    const paidInput = el('paid-amount');
    
    console.log("Invoice System Loading...");

    let masterItems = [];
    let masterCustomers = [];

    // Initialize listeners
    if (addRowBtn) {
        addRowBtn.onclick = (e) => {
            if (e) e.preventDefault();
            window.addRow();
        };
    }

    if (gstInput) gstInput.oninput = calculateInvoice;
    if (el('gst-type-select')) el('gst-type-select').onchange = calculateInvoice;
    if (el('discount-input')) el('discount-input').oninput = calculateInvoice;
    if (paidInput) paidInput.oninput = updateOutstanding;

    // Fetch Master Data on Load
    async function loadMasterData() {
        try {
            const [itemRes, custRes] = await Promise.all([
                fetch('/ItemMaster/GetAllItems'),
                fetch('/Customers/GetAllCustomers')
            ]);
            
            if (itemRes.ok) masterItems = await itemRes.json();
            if (custRes.ok) masterCustomers = await custRes.json();

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
    if (custSelect) {
        custSelect.onchange = () => {
            const val = custSelect.value;
            const nameInput = el('cust-name');
            const mobileInput = el('cust-mobile');
            const addressInput = el('cust-address');

            if (val === "custom") {
                if (nameInput) { nameInput.style.display = "block"; nameInput.value = ""; }
                if (mobileInput) mobileInput.value = "";
                if (addressInput) addressInput.value = "";
            } else {
                if (nameInput) nameInput.style.display = "none";
                const selected = masterCustomers.find(c => c.id == val);
                if (selected) {
                    if (nameInput) nameInput.value = selected.name;
                    if (mobileInput) mobileInput.value = selected.mobile || "";
                    if (addressInput) addressInput.value = selected.address || "";
                }
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
                <td><span class="row-number">${rowCount}</span></td>
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
                <td><input type="text" class="huid-num" placeholder="HUID Number"></td>
                <td><input type="text" class="purity-val" placeholder="Purity"></td>
                <td><input type="number" class="gross-wt" step="0.001" value="0.000"></td>
                <td><input type="number" class="net-wt" step="0.001" value="0.000"></td>
                <td><input type="number" class="rate" step="0.01" value="0.00"></td>
                <td><input type="number" class="making" step="0.01" value="0.00"></td>
                <td style="text-align: right;"><strong class="item-amount">₹ 0.00</strong></td>
                <td><button type="button" class="btn-remove" title="Remove"><i class="fas fa-trash"></i></button></td>
            `;

            const select = row.querySelector('.item-name-select');
            const nameInput = row.querySelector('.item-name');
            const rateInput = row.querySelector('.rate');
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
                        rateInput.value = itemInfo.defaultRate || 0;
                        purityInput.value = itemInfo.purity || "";
                        if ((itemInfo.stockQuantity || 0) <= 0) alert("⚠️ Warning: Out of Stock!");
                        calculateInvoice();
                    }
                }
            };

            row.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', calculateInvoice);
            });

            row.querySelector('.btn-remove').onclick = () => {
                row.remove();
                updateRowNumbers();
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
        
        const rows = itemsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const nWt = parseFloat(row.querySelector('.net-wt')?.value) || 0;
            const rt = parseFloat(row.querySelector('.rate')?.value) || 0;
            const mk = parseFloat(row.querySelector('.making')?.value) || 0;
            
            const goldVal = nWt * rt;
            const totalRow = goldVal + mk;
            
            goldValTotal += goldVal;
            makingTotal += mk;
            
            const amtEl = row.querySelector('.item-amount');
            if (amtEl) amtEl.textContent = `₹ ${totalRow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
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
                const invoiceData = {
                    invoiceNo: el('invoice-no')?.value || "",
                    date: el('invoice-date')?.value || "",
                    paymentMode: document.querySelector('input[name="payment-mode"]:checked')?.value || "Cash",
                    paidAmount: parseFloat(el('paid-amount')?.value) || 0,
                    gstRate: parseFloat(el('gst-rate-input')?.value) || 0,
                    discount: parseFloat(el('discount-input')?.value) || 0,
                    remarks: el('remarks')?.value || "",
                    customer: {
                        name: el('cust-name')?.value || "",
                        mobile: el('cust-mobile')?.value || "",
                        address: el('cust-address')?.value || ""
                    },
                    items: [],
                    goldValueTotal: getTxtVal('break-gold-value'),
                    makingChargesTotal: getTxtVal('break-making-charges'),
                    subTotal: getTxtVal('break-sub-total'),
                    cgst: getTxtVal('break-cgst'),
                    sgst: getTxtVal('break-sgst'),
                    igst: getTxtVal('break-igst'),
                    totalAmount: getTxtVal('break-total-amount'),
                    roundedOff: parseFloat(el('break-rounded')?.innerText.replace(/[^0-9.-]+/g, "")) || 0
                };

                const rows = itemsTableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    invoiceData.items.push({
                        itemName: row.querySelector('.item-name')?.value || "",
                        huid: row.querySelector('.huid-num')?.value || "",
                        purity: row.querySelector('.purity-val')?.value || "",
                        grossWt: parseFloat(row.querySelector('.gross-wt')?.value) || 0,
                        netWt: parseFloat(row.querySelector('.net-wt')?.value) || 0,
                        rate: parseFloat(row.querySelector('.rate')?.value) || 0,
                        makingCharges: parseFloat(row.querySelector('.making')?.value) || 0,
                        amount: parseFloat(row.querySelector('.item-amount')?.innerText.replace(/[^0-9.-]+/g, "")) || 0
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
                    alert("Error saving invoice.");
                }
            } catch (err) { console.error(err); alert("Save failed."); }
        };
    }

    // Run initialization
    (async () => {
        // Auto-mini sidebar
        const sb = el('main-sidebar');
        if (sb) sb.classList.add('mini');
        
        if (dateInput) dateInput.valueAsDate = new Date();
        await loadMasterData();
        if (itemsTableBody && itemsTableBody.children.length === 0) window.addRow();
    })();
});
