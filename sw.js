// --- SİPARİŞ SİSTEMİ DEĞİŞKENLERİ ---
const orderTemplates = {
    "Manav": ["Çilek", "Domates", "Salatalık", "Muz", "Havuç", "Portakal", "Limon", "Kıvırcık", "Maydanoz", "Nane", "Taze Zencefil"],
    "Süt": ["Tam Yağlı Süt (Koli)", "Laktozsuz Süt (Koli)", "Badem Sütü (Koli)", "Soya Sütü (Koli)", "Yulaf Sütü (Koli)", "Krema (Kutu)"],
    "Su": ["0.5L Pet Su (Koli)", "1.5L Pet Su (Koli)", "Cam Şişe Su (Koli)"],
    "Soda": ["Sade Soda (Koli)", "Meyveli Soda (Koli)", "Elmalı Soda (Koli)"]
};

let orderCounts = {}; // Seçilen ürünlerin adetlerini tutacağımız obje
let currentOrderCategory = "Manav"; // Varsayılan kategori

// --- LİSTEYİ YÜKLEME FONKSİYONU ---
function loadOrderTemplate(category, chipElement) {
    currentOrderCategory = category;
    
    // Aktif chip'in görselini güncelle
    if(chipElement) {
        document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.remove('active'));
        chipElement.classList.add('active');
    }

    // Başlığı güncelle
    const titleEl = document.getElementById('currentTemplateTitle');
    if(titleEl) titleEl.innerText = `${category} Listesi`;

    const container = document.getElementById('orderTemplateList');
    if(!container) return;
    
    container.innerHTML = '';
    const items = orderTemplates[category] || [];

    if(items.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">Bu kategoride ürün bulunmuyor.</div>`;
        return;
    }

    items.forEach(item => {
        // Önceden seçilmiş bir adet varsa onu al, yoksa 0 yap
        const count = orderCounts[item] || 0;
        const rowClass = count > 0 ? "order-row active-row" : "order-row";

        container.innerHTML += `
            <div class="${rowClass}" id="order-row-${item.replace(/\s+/g, '-')}">
                <div style="font-weight:600; font-size:14px; color:var(--text-main); flex:1;">${item}</div>
                <div class="counter">
                    <button class="btn-count" onclick="updateOrderCount('${item}', -1)"><i class="fa-solid fa-minus" style="font-size:14px;"></i></button>
                    <span id="count-${item.replace(/\s+/g, '-')}" style="width:24px; text-align:center; font-weight:800; font-size:16px;">${count}</span>
                    <button class="btn-count" onclick="updateOrderCount('${item}', 1)"><i class="fa-solid fa-plus" style="font-size:14px;"></i></button>
                </div>
            </div>
        `;
    });
}

// --- ADET GÜNCELLEME FONKSİYONU ---
function updateOrderCount(item, change) {
    if (!orderCounts[item]) orderCounts[item] = 0;
    
    orderCounts[item] += change;
    if (orderCounts[item] < 0) orderCounts[item] = 0; // 0'ın altına düşmesin

    const safeId = item.replace(/\s+/g, '-');
    const countSpan = document.getElementById(`count-${safeId}`);
    const rowDiv = document.getElementById(`order-row-${safeId}`);

    if (countSpan) countSpan.innerText = orderCounts[item];
    
    if (rowDiv) {
        if (orderCounts[item] > 0) {
            rowDiv.classList.add('active-row');
        } else {
            rowDiv.classList.remove('active-row');
        }
    }
}

// --- SAYAÇLARI SIFIRLAMA FONKSİYONU ---
function resetCounters() {
    if(confirm(`${currentOrderCategory} listesindeki tüm adetleri sıfırlamak istiyor musunuz?`)) {
        // Yalnızca ekrandaki kategorinin ürünlerini sıfırla
        const items = orderTemplates[currentOrderCategory] || [];
        items.forEach(item => {
            orderCounts[item] = 0;
        });
        loadOrderTemplate(currentOrderCategory); // Ekranı yenile
        showToast("Liste sıfırlandı.");
    }
}

// --- WHATSAPP'A GÖNDERME FONKSİYONU ---
function sendOrderViaWhatsApp() {
    // Sadece adedi 0'dan büyük olan ürünleri filtrele
    const selectedItems = Object.entries(orderCounts).filter(([item, count]) => count > 0);
    
    if (selectedItems.length === 0) {
        showToast("Lütfen göndermeden önce listeye ürün ekleyin.", true);
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
        return;
    }

    const dateStr = new Date().toLocaleDateString('tr-TR');
    
    // Mesaj Şablonunu Oluşturma
    let message = `📦 *SİPARİŞ FİŞİ*\n`;
    message += `📅 *Tarih:* ${dateStr}\n`;
    message += `👤 *Gönderen:* ${currentUser ? currentUser.name.split(' ')[0] : 'Personel'}\n`;
    message += `➖➖➖➖➖➖➖➖➖➖\n\n`;

    selectedItems.forEach(([item, count]) => {
        message += `▪️ ${count} x ${item}\n`;
    });

    message += `\nKolay gelsin.`;

    // URL kodlaması (Boşlukları, satır atlamaları URL formatına dönüştürür)
    const encodedMessage = encodeURIComponent(message);
    
    // API Linki
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    
    // Yeni sekmede WhatsApp'ı aç
    window.open(whatsappUrl, '_blank');
    
    // Log olarak sisteme kaydet (Opsiyonel: Hangi vardiyada sipariş geçildiğini takip etmek için)
    logAction("Sipariş Gönderildi", `${selectedItems.length} kalem ürün WhatsApp üzerinden paylaşıldı.`);
}

// Sayfa yüklendiğinde ilk kategoriyi (Manav) ekrana basması için başlatıcıya ekle:
// setTimeout(initDatabase, 100); fonksiyonunun altına şu satırı ekleyebilirsin:
// loadOrderTemplate('Manav');
