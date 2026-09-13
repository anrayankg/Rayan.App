"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function Row({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{String(value)}</div>
    </div>
  );
}

function PhoneRow({ label, value }) {
  if (!value) return null;
  const clean = String(value).replace(/[^\d+]/g, "");
  const waNumber = clean.replace(/^\+/, "");
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value phone-actions">
        <span>{value}</span>
        <a href={`tel:${clean}`} className="phone-action-btn" title="Позвонить">📞</a>
        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="phone-action-btn" title="Написать в WhatsApp">💬</a>
      </div>
    </div>
  );
}

function yesNo(v) {
  if (v === true) return "да";
  if (v === false) return "нет";
  return null;
}

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [listing, setListing] = useState(null);
  const [contact, setContact] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: l, error: e1 } = await supabase.from("listings").select("*").eq("id", id).single();
        if (e1) throw e1;
        setListing(l);

        const { data: c } = await supabase.from("listing_contacts").select("*").eq("listing_id", id).maybeSingle();
        setContact(c || null);

        const { data: f } = await supabase.from("listing_financial").select("*").eq("listing_id", id).maybeSingle();
        setFinancial(f || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return <div className="app-shell"><div className="empty-state">Загрузка…</div></div>;
  if (error) return <div className="app-shell"><div className="status-msg error" style={{ margin: 20 }}>Не удалось загрузить: {error}</div></div>;
  if (!listing) return <div className="app-shell"><div className="empty-state">Объект не найден</div></div>;

  let extra = {};
  try { extra = listing.extra_details ? (typeof listing.extra_details === "string" ? JSON.parse(listing.extra_details) : listing.extra_details) : {}; } catch {}

  return (
    <div className="app-shell">
      <div className="page-header">
        <a className="back-link" onClick={() => router.push("/my")}>←</a>
        <div className="page-title">{listing.display_id || listing.legacy_id || "Объект"}</div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Основное</div>
        <Row label="Статус" value={listing.status} />
        <Row label="Тип" value={listing.type} />
        <Row label="Комнатность" value={listing.room_type || listing.rooms} />
        <Row label="Цена" value={listing.price ? `${Number(listing.price).toLocaleString("ru-RU")} ${listing.currency || ""}` : null} />
        <Row label="Площадь" value={listing.area_m2 ? `${listing.area_m2} м²` : null} />
        <Row label="Этаж/Этажность" value={listing.floor && listing.floors_total ? `${listing.floor}/${listing.floors_total}` : null} />
        <Row label="Город" value={listing.city} />
        <Row label="Район" value={listing.district} />
        <Row label="Точка на карте" value={listing.map_lat && listing.map_lng ? `${listing.map_lat}, ${listing.map_lng}` : "не указана"} />
        <Row label="ЖК" value={listing.zhk} />
        <Row label="СК / Застройщик" value={listing.sk} />
        <Row label="Документы" value={listing.documents} />
        <Row label="Отопление" value={listing.heating} />
        <Row label="Газ" value={yesNo(listing.gas)} />
        <Row label="Вода" value={yesNo(listing.water)} />
        <Row label="Электричество" value={yesNo(listing.electricity)} />
        <Row label="Канализация" value={yesNo(listing.sewerage)} />
        <Row label="Горячая вода" value={yesNo(listing.hot_water)} />
        <Row label="Условия сделки" value={listing.deal_terms} />
        <Row label="Обмен на" value={listing.obmen_na} />
        <Row label="Торг" value={yesNo(listing.torg)} />
        <Row label="Статус рекламы" value={listing.ad_status} />
      </div>

      {listing.description && (
        <div className="detail-section">
          <div className="detail-section-title">Описание</div>
          <div className="detail-description">{listing.description}</div>
        </div>
      )}

      <div className="detail-section private">
        <div className="detail-section-title">Договор</div>
        <Row label="Статус договора" value={listing.contract_status} />
      </div>

      {contact && (
        <div className="detail-section private">
          <div className="detail-section-title">Информация для агента</div>
          <Row label="Источник" value={contact.source_type} />
          <Row label="ФИО собственника" value={contact.owner_name} />
          <PhoneRow label="Телефон собственника" value={contact.owner_phone} />
          <Row label="Точный адрес" value={contact.exact_address} />
        </div>
      )}

      {financial && (
        <div className="detail-section private">
          <div className="detail-section-title">Финансовая информация</div>
          <Row label="Цена в руки" value={financial.v_ruki ? `${financial.v_ruki} ${financial.v_ruki_currency || ""}` : null} />
          <Row label="Комиссия" value={financial.commission_percent} />
          <Row label="Условия комиссии" value={financial.commission_terms} />
          <Row label="Заметка агента" value={financial.agent_notes} />
        </div>
      )}

      <div className="detail-section">
        <div className="detail-section-title">Контакт агента</div>
        <Row label="Имя" value={listing.agent_name} />
        <PhoneRow label="Телефон" value={listing.agent_phone} />
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Новостройка</div>
        <Row label="Проходит через Госрегистр" value={listing.gosregistr === true ? "да" : listing.gosregistr === false ? "нет" : null} />
        <Row label="Сдан / не сдан" value={listing.is_delivered === true ? "Сдан" : listing.is_delivered === false ? "Не сдан" : null} />
        <Row label="Срок сдачи" value={listing.delivery_year ? `${listing.delivery_quarter ? listing.delivery_quarter + " кв. " : ""}${listing.delivery_year}` : null} />
      </div>

      {Object.keys(extra).length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">Дополнительно</div>
          {Object.entries(extra).map(([k, v]) => (
            <Row key={k} label={k} value={typeof v === "object" ? JSON.stringify(v) : v} />
          ))}
        </div>
      )}
    </div>
  );
}
