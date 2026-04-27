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
    
    // Bill Settings from server
    const BS = window.BILL_SETTINGS || {};

    console.log("Invoice System Loading...", BS);

    let masterItems = [];
    let masterCustomers = [];
    let shopSettings = null;

    // Apply column visibility from Bill Settings
    function applyColumnVisibility() {
        const colMap = {
            'bill-col-metal': BS.showMetal !== false,
            'bill-col-purity': BS.showPurity !== false,
            'bill-col-finewt': BS.showFineWt !== false,
            'bill-col-rate': BS.showRate !== false,
            'bill-col-metalamt': BS.showMetalAmt !== false,
            'bill-col-makingpct': BS.showMakingPct !== false,
            'bill-col-makingamt': BS.showMakingAmt !== false
        };

        Object.entries(colMap).forEach(([cls, show]) => {
            document.querySelectorAll(`.${cls}`).forEach(cell => {
                cell.style.display = show ? '' : 'none';
            });
        });
    }

    // Initialize listeners
    if (addRowBtn) {
        addRowBtn.onclick = (e) => {
            if (e) e.preventDefault();
            window.addRow();
        };
    }

    if (gstInput) gstInput.oninput = calculateInvoice;
    if (el('daily-rate')) el('daily-rate').oninput = calculateInvoice;
    if (el('silver-rate')) el('silver-rate').oninput = calculateInvoice;
    if (el('gst-type-select')) el('gst-type-select').onchange = calculateInvoice;
    const dInput = el('discount-input');
    if (dInput) dInput.addEventListener('input', calculateInvoice);
    if (paidInput) paidInput.addEventListener('input', updateOutstanding);
    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            fetchNextNumber();
            calculateInvoice();
        });
    }

    // Metal Receipt Calculations
    const metalReceiptWeight = el('metal-receipt-weight');
    const metalReceiptPurity = el('metal-receipt-purity');
    const metalReceiptType = el('metal-receipt-type');
    const metalReceiptFineDisplay = el('metal-receipt-fine-display');

    if (metalReceiptWeight && metalReceiptPurity && metalReceiptFineDisplay) {
        const updateMetalFine = () => {
            const wt = parseFloat(metalReceiptWeight.value) || 0;
            const pur = parseFloat(metalReceiptPurity.value) || 0;
            const fine = wt * (pur / 100);
            metalReceiptFineDisplay.textContent = fine.toFixed(3);
        };
        metalReceiptWeight.oninput = updateMetalFine;
        metalReceiptPurity.oninput = updateMetalFine;
    }

    if (el('print-option')) {
        el('print-option').addEventListener('change', () => {
            calculateInvoice();
            // Visual feedback effect
            const breakdown = document.querySelector('.total-breakdown');
            if (breakdown) {
                breakdown.style.transform = 'scale(1.02)';
                setTimeout(() => breakdown.style.transform = 'scale(1)', 200);
            }
        });
    }

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

    async function fetchCustomerBalance(id) {
        try {
            const res = await fetch(`/Customers/GetCustomerBalance/${id}`);
            if (res.ok) {
                const data = await res.json();
                el('bal-gold').textContent = `${data.gold.toFixed(3)} g`;
                el('bal-silver').textContent = `${data.silver.toFixed(3)} g`;
                el('bal-amount').textContent = `₹ ${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${data.amountType})`;
                
                // Color coding for amount
                el('bal-amount').style.color = data.amountType === "Dr" ? "#4CAF50" : "#d9534f";
                
                el('customer-balance-info').style.display = "block";
            }
        } catch (err) {
            console.error("Failed to fetch customer balance:", err);
        }
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
                if (el('cust-opening-gold')) el('cust-opening-gold').value = "0.000";
                if (el('cust-opening-silver')) el('cust-opening-silver').value = "0.000";
                if (el('customer-balance-info')) el('customer-balance-info').style.display = "none";
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
                    if (el('cust-opening-gold')) el('cust-opening-gold').value = selected.openingGold || 0;
                    if (el('cust-opening-silver')) el('cust-opening-silver').value = selected.openingSilver || 0;

                    // AUTO GST
                    if (gstTypeSelect && shopSettings && selected.stateCode) {
                        gstTypeSelect.value = (shopSettings.stateCode === selected.stateCode) ? "intra" : "inter";
                    }
                    
                    fetchCustomerBalance(val);
                    calculateInvoice();
                }
            } else {
                if (newCustContainer) newCustContainer.style.display = "none";
                if (el('customer-balance-info')) el('customer-balance-info').style.display = "none";
            }
        };
    }

    // Get purity value from the purity string (e.g., "22K" -> 91.6, "91.6" -> 91.6)
    function parsePurityValue(purityStr) {
        if (!purityStr) return 0;
        const str = purityStr.toString().trim().toUpperCase();
        // Known karats
        const karatMap = { '24K': 99.9, '23K': 95.8, '22K': 91.6, '21K': 87.5, '20K': 83.3, '18K': 75.0, '14K': 58.3 };
        if (karatMap[str]) return karatMap[str];
        // Try parse as number (e.g., "91.6%" or "91.6")
        const num = parseFloat(str.replace('%', ''));
        return isNaN(num) ? 0 : num;
    }

    // Add Row Logic — matching the new bill settings layout
    let rowCounter = 0;
    window.addRow = function() {
        if (!itemsTableBody) return;
        
        try {
            rowCounter++;
            const row = document.createElement('tr');
            
            let optionsHtml = masterItems.map(item => 
                `<option value="${item.name}" data-category="${item.category || 'Gold'}" data-purity="${item.purity || ''}">${item.name} (${item.purity || ''} - Stock: ${item.stockQuantity || 0})</option>`
            ).join('');

            const defaultMakingPct = BS.defaultMakingPercent || 10;

            row.innerHTML = `
                <td class="row-sno">${rowCounter}</td>
                <td>
                    <select class="ri-select">
                        <option value="I" selected>I</option>
                        <option value="R">R</option>
                    </select>
                </td>
                <td>
                    <div class="item-select-container">
                        <select class="item-name-select" style="margin-bottom: 5px;">
                            <option value="">-- Select Item --</option>
                            ${optionsHtml}
                            <option value="custom">Other (Manual Entry)</option>
                        </select>
                        <div class="custom-item-details" style="display:none; border: 1px solid var(--primary-gold-light); padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.5);">
                            <input type="text" class="item-name custom-name" placeholder="Enter Product Name" style="margin-bottom: 5px;">
                            <select class="custom-category" style="font-size: 0.8rem; padding: 4px;">
                                <option value="Gold">Gold Item</option>
                                <option value="Silver">Silver Item</option>
                            </select>
                        </div>
                    </div>
                </td>
                <td class="bill-col-metal">
                    <select class="metal-select">
                        <option value="Gold" selected>Gold</option>
                        <option value="Silver">Silver</option>
                    </select>
                </td>
                <td><input type="number" class="gross-wt" step="0.001" value="0.000"></td>
                <td class="bill-col-purity"><input type="number" class="purity-val" step="0.01" value="91.60" placeholder="Purity %"></td>
                <td class="bill-col-finewt"><input type="number" class="fine-wt" step="0.001" value="0.000" readonly tabindex="-1"></td>
                <td class="bill-col-rate"><input type="number" class="rate-val" step="0.01" value="0" readonly tabindex="-1"></td>
                <td class="bill-col-metalamt" style="text-align: right;"><strong class="metal-amount">0</strong></td>
                <td class="bill-col-makingpct">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <input type="number" class="making-pct" step="0.01" value="${defaultMakingPct}">
                        <select class="making-type-select" style="font-size: 0.65rem; padding: 2px; height: 20px; border-radius: 4px; border: 1px solid #ddd; background: rgba(255,255,255,0.8);">
                            <option value="Percentage" ${BS.makingChargeType === 'Percentage' ? 'selected' : ''}>%</option>
                            <option value="Flat" ${BS.makingChargeType === 'Flat' ? 'selected' : ''}>₹ Flat</option>
                            <option value="PerKG" ${BS.makingChargeType === 'PerKG' ? 'selected' : ''}>/ kg</option>
                        </select>
                    </div>
                </td>
                <td class="bill-col-makingamt"><input type="number" class="making-amount" step="0.01" value="0"></td>
                <td style="text-align: right;"><strong class="item-amount" style="color: var(--primary-gold-dark); white-space: nowrap;">₹ 0</strong></td>
                <td><button type="button" class="btn-remove" title="Remove"><i class="fas fa-trash"></i></button></td>
            `;

            const select = row.querySelector('.item-name-select');
            const customContainer = row.querySelector('.custom-item-details');
            const nameInput = row.querySelector('.item-name');
            const purityInput = row.querySelector('.purity-val');
            const customCat = row.querySelector('.custom-category');
            const metalSelect = row.querySelector('.metal-select');

            select.onchange = () => {
                const val = select.value;
                if (val === "custom") {
                    customContainer.style.display = "block";
                    nameInput.value = "";
                    row.dataset.category = customCat.value;
                    metalSelect.value = customCat.value;
                } else {
                    customContainer.style.display = "none";
                    nameInput.value = val;
                    const itemInfo = masterItems.find(i => i.name === val);
                    if (itemInfo) {
                        const pVal = parsePurityValue(itemInfo.purity);
                        purityInput.value = pVal.toFixed(2);
                        const category = itemInfo.category || "Gold";
                        row.dataset.category = category;
                        metalSelect.value = category;

                        // NEW: Auto-apply Silver Labor Rate
                        if (category === "Silver" && BS.silverMakingRate) {
                            const mTypeSelect = row.querySelector('.making-type-select');
                            const mPctInput = row.querySelector('.making-pct');
                            if (mTypeSelect) mTypeSelect.value = "PerKG";
                            if (mPctInput) mPctInput.value = BS.silverMakingRate;
                        }

                        if ((itemInfo.stockQuantity || 0) <= 0) alert("⚠️ Warning: Out of Stock!");
                        calculateInvoice();
                    }
                }
            };

            customCat.onchange = () => {
                row.dataset.category = customCat.value;
                metalSelect.value = customCat.value;
                calculateInvoice();
            };

            metalSelect.onchange = () => {
                row.dataset.category = metalSelect.value;
                calculateInvoice();
            };

            const riSelect = row.querySelector('.ri-select');
            riSelect.onchange = calculateInvoice;

            const mTypeSelect = row.querySelector('.making-type-select');
            if (mTypeSelect) mTypeSelect.onchange = calculateInvoice;

            const makingPctInput = row.querySelector('.making-pct');
            const makingAmtInput = row.querySelector('.making-amount');

            // If user types directly into making amount, clear out the percentage to prevent auto-override
            if (makingAmtInput && makingPctInput) {
                makingAmtInput.addEventListener('input', () => {
                    makingPctInput.value = ''; 
                });
            }

            row.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', calculateInvoice);
            });

            row.querySelector('.btn-remove').onclick = () => {
                row.remove();
                updateRowNumbers();
                calculateInvoice();
            };

            itemsTableBody.appendChild(row);
            applyColumnVisibility();
            calculateInvoice();
        } catch (err) {
            console.error("Error adding row:", err);
        }
    }

    function updateRowNumbers() {
        const rows = itemsTableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const numEl = row.querySelector('.row-sno');
            if (numEl) numEl.textContent = index + 1;
        });
        rowCounter = rows.length;
    }

    function calculateInvoice() {
        if (!itemsTableBody) return;
        let metalValTotal = 0;
        let makingTotal = 0;
        const goldRate = parseFloat(el('daily-rate')?.value) || 0;
        const silverRate = parseFloat(el('silver-rate')?.value) || 0;
        
        const rows = itemsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const ri = row.querySelector('.ri-select')?.value || 'I';
            const gWt = parseFloat(row.querySelector('.gross-wt')?.value) || 0;
            const purity = parseFloat(row.querySelector('.purity-val')?.value) || 0;
            const makingPct = parseFloat(row.querySelector('.making-pct')?.value) || 0;
            const metalSelect = row.querySelector('.metal-select');
            const category = metalSelect ? metalSelect.value : (row.dataset.category || "Gold");
            
            // Use correct rate based on metal type
            const currentRate = (category === "Silver") ? silverRate : goldRate;
            
            // Show rate in the Rate column
            const rateInput = row.querySelector('.rate-val');
            if (rateInput) rateInput.value = currentRate.toFixed(2);
            
            // Calculate Fine Weight and Metal Amount based on Billing Mode
            let fWt = 0;
            let metalAmt = 0;

            if (purity && purity > 0) {
                // Advanced Billing (Purity based)
                fWt = gWt * (purity / 100);
                metalAmt = fWt * currentRate;
            } else {
                // Simple Billing (Gross Wt based) when Purity is not defined or 0
                fWt = gWt; // Or 0, but conceptually it uses Gross Wt
                metalAmt = gWt * currentRate;
            }

            const fineWtInput = row.querySelector('.fine-wt');
            if (fineWtInput) fineWtInput.value = fWt.toFixed(3);

            const metalAmtEl = row.querySelector('.metal-amount');
            if (metalAmtEl) metalAmtEl.textContent = Math.round(metalAmt).toLocaleString('en-IN');
            
            // Calculate Making Amount
            let makingAmt = 0;
            const makingAmtInput = row.querySelector('.making-amount');
            const makingType = row.querySelector('.making-type-select')?.value || BS.makingChargeType;
            
            if (makingPct > 0) {
                // Calculate from percentage or rate
                if (makingType === 'Flat') {
                    makingAmt = makingPct; // In flat mode, the input is the direct amount
                } else if (makingType === 'PerKG') {
                    makingAmt = (gWt / 1000) * makingPct; // Rate per KG (gWt is in grams)
                } else {
                    makingAmt = metalAmt * (makingPct / 100); // Percentage mode
                }
                if (makingAmtInput) makingAmtInput.value = Math.round(makingAmt);
            } else {
                // If percentage is 0 or empty, trust the direct amount input
                makingAmt = parseFloat(makingAmtInput?.value) || 0;
            }
            
            // Total for this row
            let totalRow = metalAmt + makingAmt;
            
            row.dataset.appliedRate = currentRate; // Store for saving
            row.dataset.metalAmount = metalAmt;
            row.dataset.makingAmount = makingAmt;

            // If Receipt (R), amount is negative (customer giving back)
            if (ri === 'R') {
                totalRow = -totalRow;
                metalValTotal += -metalAmt;
                makingTotal += -makingAmt;
            } else {
                metalValTotal += metalAmt;
                makingTotal += makingAmt;
            }
            
            const amtEl = row.querySelector('.item-amount');
            if (amtEl) {
                const prefix = totalRow < 0 ? "- ₹ " : "₹ ";
                amtEl.textContent = `${prefix}${Math.abs(Math.round(totalRow)).toLocaleString('en-IN')}`;
                if (totalRow < 0) amtEl.style.color = "#d9534f"; // Red for receipt
                else amtEl.style.color = "var(--primary-gold-dark)";
            }
        });

        const subTotalVal = metalValTotal + makingTotal;
        const totalGstRate = parseFloat(el('gst-rate-input')?.value) || 0;
        const gstType = el('gst-type-select')?.value || 'intra';
        const docType = typeSelect ? typeSelect.value : 'Tax Invoice';
        const isEstimate = docType === 'Rough Estimate';
        
        let cgstVal = 0, sgstVal = 0, igstVal = 0;
        
        const gstContainer = el('gst-container');
        if (gstContainer) {
            gstContainer.style.display = isEstimate ? 'none' : 'block';
        }

        if (!isEstimate) {
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
        }

        const discountVal = parseFloat(el('discount-input')?.value) || 0;
        const totalWithGst = (subTotalVal + cgstVal + sgstVal + igstVal) - discountVal;
        const roundedTotal = Math.round(totalWithGst);
        const roundOffVal = roundedTotal - totalWithGst;

        const setTxt = (id, val) => {
            const target = el(id);
            if (target) target.textContent = `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        };

        setTxt('break-gold-value', metalValTotal);
        setTxt('break-making-charges', makingTotal);
        setTxt('break-sub-total', subTotalVal);
        setTxt('break-cgst', cgstVal);
        setTxt('break-sgst', sgstVal);
        setTxt('break-igst', igstVal);
        setTxt('break-total-amount', roundedTotal);
        setTxt('summary-subtotal', subTotalVal);
        setTxt('summary-gst', cgstVal + sgstVal + igstVal);
        setTxt('summary-total', roundedTotal);
        
        const rEl = el('break-rounded');
        if (rEl) rEl.textContent = `₹ ${roundOffVal.toFixed(2)}`;
        
        // --- PREVIEW PRINT OPTIONS ---
        const printOpt = el('print-option')?.value || "None";
        const weightRow = el('preview-weight-row');
        const balanceRow = el('preview-balance-row');
        
        if (weightRow) weightRow.style.display = (printOpt === "Weight" || printOpt === "Both") ? "flex" : "none";
        if (balanceRow) balanceRow.style.display = (printOpt === "Balance" || printOpt === "Both") ? "flex" : "none";

        // Calculate Total Fine Weight
        let totalFineWt = 0;
        itemsTableBody.querySelectorAll('tr').forEach(row => {
            totalFineWt += parseFloat(row.querySelector('.fine-wt')?.value) || 0;
        });
        if (el('preview-total-weight')) el('preview-total-weight').textContent = `${totalFineWt.toFixed(3)} g`;

        // Calculate Net Balance
        const custId = el('cust-name-select')?.value;
        let currentBalance = 0;
        if (custId && custId !== 'custom') {
            const cust = masterCustomers.find(c => c.id == custId);
            if (cust) {
                // Simplified calculation: Opening + Net of all current sessions
                // For a real-time "Net Balance", we ideally need the server's current balance for the customer.
                // But we can approximate with OpeningBalance + Outstanding of this invoice for now.
                currentBalance = parseFloat(cust.openingBalance) || 0;
                if (cust.balanceType == 2) currentBalance = -currentBalance; // Cr
            }
        } else if (custId === 'custom') {
            currentBalance = parseFloat(el('cust-opening-bal')?.value) || 0;
            if (el('cust-bal-type')?.value == "2") currentBalance = -currentBalance;
        }

        const outstanding = roundedTotal - (parseFloat(el('paid-amount')?.value) || 0);
        const netPending = currentBalance + outstanding;
        if (el('preview-net-balance')) el('preview-net-balance').textContent = `₹ ${netPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

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

    const getInvoiceData = () => {
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
            PrintOption: el('print-option')?.value || "None",
            CustomerId: isNewCust ? 0 : parseInt(custIdVal),
            Customer: isNewCust ? {
                Name: el('cust-name')?.value || "",
                Mobile: el('cust-mobile')?.value || "",
                GSTIN: el('cust-gstin')?.value || "",
                Address: el('cust-address')?.value || "",
                OpeningBalance: parseFloat(el('cust-opening-bal')?.value) || 0,
                OpeningGold: parseFloat(el('cust-opening-gold')?.value) || 0,
                OpeningSilver: parseFloat(el('cust-opening-silver')?.value) || 0,
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
            RoundedOff: parseFloat(el('break-rounded')?.innerText.replace(/[^0-9.-]+/g, "")) || 0,
            
            // New: Metal Receipt Fields
            MetalReceivedType: el('metal-receipt-type')?.value,
            MetalReceivedWeight: parseFloat(el('metal-receipt-weight')?.value) || 0,
            MetalReceivedPurity: parseFloat(el('metal-receipt-purity')?.value) || 0,
            MetalReceivedFineWeight: parseFloat(el('metal-receipt-fine-display')?.textContent) || 0
        };

        const rows = itemsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const rowAmt = parseFloat(row.querySelector('.item-amount')?.innerText.replace(/[^0-9.-]+/g, "")) || 0;
            const gWt = parseFloat(row.querySelector('.gross-wt')?.value) || 0;
            const metalSelect = row.querySelector('.metal-select');
            invoiceData.Items.push({
                ItemName: row.querySelector('.item-name')?.value || row.querySelector('.item-name-select')?.value || "",
                RI: row.querySelector('.ri-select')?.value || "I",
                Metal: metalSelect ? metalSelect.value : (row.dataset.category || "Gold"),
                Purity: row.querySelector('.purity-val')?.value || "",
                GrossWt: gWt,
                NetWt: gWt, 
                FineWt: parseFloat(row.querySelector('.fine-wt')?.value) || 0,
                Rate: parseFloat(row.dataset.appliedRate) || 0,
                MetalAmount: parseFloat(row.dataset.metalAmount) || 0,
                MakingPercent: parseFloat(row.querySelector('.making-pct')?.value) || 0,
                MakingCharges: parseFloat(row.dataset.makingAmount) || 0,
                Amount: rowAmt
            });
        });
        return invoiceData;
    };

    const previewBtn = el('preview-invoice-btn');
    if (previewBtn) {
        previewBtn.onclick = async () => {
            try {
                const invoiceData = getInvoiceData();
                const response = await fetch('/Invoices/Preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });

                if (response.ok) {
                    const html = await response.text();
                    const win = window.open('', '_blank');
                    win.document.write(html);
                    win.document.close();
                } else {
                    alert("Preview failed. Please ensure all items are filled.");
                }
            } catch (err) {
                console.error(err);
                alert("Preview error: " + err.message);
            }
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            try {
                const custIdVal = el('cust-name-select')?.value;
                const isNewCust = custIdVal === 'custom' || !custIdVal;
                
                // --- CUSTOMER VALIDATION ---
                if (isNewCust) {
                    const name = el('cust-name')?.value.trim();
                    const mobile = el('cust-mobile')?.value.trim();
                    const address = el('cust-address')?.value.trim();

                    if (!name) { alert("⚠️ Required: Please enter the Customer Full Name."); el('cust-name').focus(); return; }
                    if (!mobile) { alert("⚠️ Required: Please enter the Mobile Number."); el('cust-mobile').focus(); return; }
                    if (!address) { alert("⚠️ Required: Please enter the Billing Address."); el('cust-address').focus(); return; }
                } else if (!custIdVal) {
                    alert("⚠️ Please select a customer or fill new details.");
                    el('cust-name-select').focus();
                    return;
                }
                
                const invoiceData = getInvoiceData();

                const response = await fetch('/Invoices/Create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });

                if (response.ok) {
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
        applyColumnVisibility();
        if (itemsTableBody && itemsTableBody.children.length === 0) window.addRow();
    })();
});
