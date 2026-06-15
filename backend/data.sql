--
-- PostgreSQL database dump
--

\restrict DBd3I5gqBO4dy13ag6lBgDukocEbAypJmwcENqPWyy5wtIz5VZ1GmcWEuhf9PZZ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: equipos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipos (id, nombre, abrev, color, created_at, foto_url, entrenador_id) FROM stdin;
336792d8-9774-452c-a3cf-619c2b5595f7	CATENACCIO FC	CAF	#888888	2026-06-13 20:37:40.777655+00	\N	\N
5a80f7c3-31ea-4356-97f6-e09688418b8e	LA MENUENCIA CF	MEN	#888888	2026-06-13 23:08:12.637348+00	\N	\N
8692b077-8cf8-45c5-bf30-6c68b3523d2c	LA CONTRA FC	CON	#D62300	2026-06-13 23:08:32.139486+00	https://res.cloudinary.com/ddad1uoef/image/upload/v1781430255/equipos/ol2rdjfc4fssgglndzhj.png	a9abcda2-a855-4fa6-a65a-c124f60bb04a
745cc0d1-b022-44fd-a67b-89b143337cf5	GRANDEZA FC	GRA	#FFFFFF	2026-06-13 23:08:32.125311+00	https://res.cloudinary.com/ddad1uoef/image/upload/v1781430076/equipos/kyghidv6g2munci3k43b.png	80aa39ab-d808-43b7-8bc2-d916905ec80b
9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	REONDA FC	REO	#888888	2026-06-13 23:10:24.3171+00	\N	\N
73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	LOS MENISCOS DE VELAZQUEZ F.C	LMV	#888888	2026-06-14 08:29:13.504093+00	\N	\N
5b5db9cc-5944-4c52-a014-c5407a426604	CATENACCIO B	CAB	#f3f3f3	2026-06-13 23:08:01.102764+00	https://res.cloudinary.com/ddad1uoef/image/upload/v1781443262/equipos/jg5tk0lfq55ihowma3s5.png	\N
1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	NEW ELITE FC	NET	#000000	2026-06-13 23:08:32.081961+00	https://res.cloudinary.com/ddad1uoef/image/upload/v1781443698/equipos/fy2jh5os0v0clajqhfex.png	\N
02c66461-42f2-4569-b606-f2eb23aa313a	LA ONCE-X	LOX	#FFFFFF	2026-06-13 23:10:45.710863+00	https://res.cloudinary.com/ddad1uoef/image/upload/v1781444195/equipos/xp2r8yu8fpuhjdxc84mi.png	\N
600d21c0-a609-45de-9cb9-48782a78c4cc	CF LOS ITV	ITV	#FFFFFF	2026-06-13 23:08:32.135186+00	https://res.cloudinary.com/ddad1uoef/image/upload/v1781431697/equipos/mm3p7svrsvw6h5dr6aoz.png	160b42db-1478-4722-bc7c-7b43c3cb6848
\.


--
-- Data for Name: cruces; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cruces (id, fase, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante, estado) FROM stdin;
\.


--
-- Data for Name: jornadas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jornadas (id, numero, fecha_inicio, fecha_fin, estado, mercado_activo) FROM stdin;
bcd9ec9d-5f00-494d-8512-19338ab91896	1	2026-06-17	2026-06-18	pendiente	t
43d9293c-4bb6-42a0-8833-0d33a2fbdefa	2	2026-06-22	2026-06-23	pendiente	t
8f9c6efa-80c6-4826-96a3-8666f51ebf57	3	2026-06-24	2026-06-25	pendiente	t
23369f69-bcad-4f4c-a074-d3531c1eb0a0	4	2026-06-30	2026-07-01	pendiente	t
3a4d7ef7-6680-4b28-a2ca-cecb0c43d2b3	5	2026-07-06	2026-07-07	pendiente	t
d7a4c532-081b-4d2a-935e-19e193389a5c	6	2026-07-08	2026-07-09	pendiente	t
7641a443-ecad-4e76-94c3-bd2dc08eb299	7	2026-07-13	2026-07-16	pendiente	t
caeeba6b-b447-4d0a-9a5d-728fd89e6765	8	2026-07-20	2026-07-21	pendiente	t
4e5e42c1-3cf4-46ae-8da4-61d6b5961baa	9	2026-07-22	2026-07-23	pendiente	t
\.


--
-- Data for Name: jugadores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jugadores (id, equipo_id, nombre, dorsal, posicion, precio_fantasy, estado_fantasy, activo, foto_url, es_titular) FROM stdin;
282ca21f-bd0a-43e2-915e-f7a561ef4f1c	5b5db9cc-5944-4c52-a014-c5407a426604	Alfonso Garcia Prieto	4	defensa	5.0	disponible	t	\N	f
8df14f47-d4a0-4d29-8732-b41081e1e735	5b5db9cc-5944-4c52-a014-c5407a426604	Antonio Jesus Dorado Durán	7	centrocampista	6.0	disponible	t	\N	f
cf53e73d-7726-4861-ae68-f07ede4afba8	5b5db9cc-5944-4c52-a014-c5407a426604	Alvaro Conde Campos	8	centrocampista	6.0	disponible	t	\N	f
2dba3e20-16be-495f-9370-16c70df5aef4	5b5db9cc-5944-4c52-a014-c5407a426604	Raul Alonso del Cerro	9	centrocampista	6.0	disponible	t	\N	f
0832286f-fb74-46a9-9068-6764aacc6091	5b5db9cc-5944-4c52-a014-c5407a426604	Francisco Javier Fernandez Duran	10	delantero	7.0	disponible	t	\N	f
4e0ff4e5-cfab-47fd-9a2b-cb4802733f0a	5b5db9cc-5944-4c52-a014-c5407a426604	Eder Gonzalez Corrales	12	delantero	7.0	disponible	t	\N	f
fe276d26-0a12-4aa2-9eaa-d6118f06321b	5b5db9cc-5944-4c52-a014-c5407a426604	Marcos Corredera Romero	13	delantero	7.0	disponible	t	\N	f
71b2b00b-cb49-4729-95aa-692d5e5cfa88	5b5db9cc-5944-4c52-a014-c5407a426604	Ezequiel Rodriguez Campos	1	portero	6.0	disponible	t	\N	t
c72c1648-7ab9-4206-a0f3-817251762b58	5b5db9cc-5944-4c52-a014-c5407a426604	Juan Pablo Godoy Gamez	2	defensa	5.0	disponible	t	\N	t
6e21d040-8a4c-45cf-9619-01ff441645bf	5b5db9cc-5944-4c52-a014-c5407a426604	Juan Robles Artacho	3	defensa	5.0	disponible	t	\N	t
a1fd8d2a-3c84-4850-b9c7-7a6f4c3b2f62	5b5db9cc-5944-4c52-a014-c5407a426604	Cesar Rodriguez Campos	5	centrocampista	6.0	disponible	t	\N	t
92df7b9e-e0d3-4980-8873-719bea7f0f91	5b5db9cc-5944-4c52-a014-c5407a426604	Jesus Morales Campos	11	delantero	7.0	disponible	t	\N	t
5f371b83-92ef-49b6-8245-9fef528e3e8b	5b5db9cc-5944-4c52-a014-c5407a426604	Borja Garcia Garcia	14	delantero	7.0	disponible	t	\N	t
5f39e394-20d2-4438-ad8a-014c36246c26	5b5db9cc-5944-4c52-a014-c5407a426604	Juan Alejandro Cuenca Melero	6	centrocampista	6.0	disponible	t	\N	t
990999be-3d83-422d-ae7a-07a2043d9e35	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Francisco Escalera Granados	9	delantero	5.0	disponible	t	\N	f
2c4b4d04-f763-4cc0-a8a4-a44f4b5a795f	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Carlos Lorca García	10	centrocampista	5.0	disponible	t	\N	f
b4e7edfb-94d7-4e3f-b109-7f0141d7f152	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Raúl Soriano Narbona	11	defensa	5.0	disponible	t	\N	f
f1df17de-d5f1-4177-9a35-910d627a8a72	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Sergio Gámez Carrión	12	delantero	5.0	disponible	t	\N	f
4a56b70f-294f-44cf-ba3a-8ed7d8ed6563	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Jorge Quintana Rodríguez	13	portero	5.0	disponible	t	\N	f
54506439-1640-4333-aeae-d01b4eb3b28d	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Isaias Carrión Fernández	14	centrocampista	5.0	disponible	t	\N	f
c307f99c-6a5f-46b6-9a4c-d7eb779fd0e9	8692b077-8cf8-45c5-bf30-6c68b3523d2c	David Fuentes García	15	delantero	5.0	disponible	t	\N	f
8d07e421-c787-47a3-bd31-1f82d982a14e	600d21c0-a609-45de-9cb9-48782a78c4cc	Jesús Trujillo Rodríguez	4	delantero	5.0	disponible	t	\N	t
18514d9c-77f6-4e7d-8a80-fff1e8d6a4df	600d21c0-a609-45de-9cb9-48782a78c4cc	Rubén Martínez Martín	9	defensa	5.0	disponible	t	\N	t
dc524c78-b159-4be8-83f0-e918fdebbbe1	600d21c0-a609-45de-9cb9-48782a78c4cc	Juanma	9	delantero	5.0	disponible	t	\N	t
1d881459-fda9-4b53-88b2-a3209659b3c9	600d21c0-a609-45de-9cb9-48782a78c4cc	Popi	4	defensa	5.0	disponible	t	\N	t
0694d87b-9534-4d51-b54d-78dbb40bea23	600d21c0-a609-45de-9cb9-48782a78c4cc	Iker 	5	centrocampista	5.0	disponible	t	\N	t
6c0c9411-6923-48d8-865d-99f66fca7a14	600d21c0-a609-45de-9cb9-48782a78c4cc	Zulo Giráldez 	6	centrocampista	5.0	disponible	t	\N	t
e8153be9-6fc8-4987-a9a7-7e525e821006	600d21c0-a609-45de-9cb9-48782a78c4cc	Manu	7	delantero	5.0	disponible	t	\N	f
ffea1470-41cd-490c-b7e4-f77ebfe53c44	600d21c0-a609-45de-9cb9-48782a78c4cc	Sánchez 	92	centrocampista	5.0	disponible	t	\N	f
8070f4c2-ad27-472f-9ae9-9ec72ff6dc3d	600d21c0-a609-45de-9cb9-48782a78c4cc	Dani Lanzas 	16	centrocampista	5.0	disponible	t	\N	f
05247db2-b8f7-4a89-bf8b-3b0fd005cb32	600d21c0-a609-45de-9cb9-48782a78c4cc	David Gordillo	8	centrocampista	5.0	disponible	t	\N	f
d443d3ad-13b5-42cf-975b-5caa8ce18557	600d21c0-a609-45de-9cb9-48782a78c4cc	Reke JR	86	centrocampista	5.0	disponible	t	\N	f
647462a3-9c5b-4b24-92eb-a1dc04557e96	600d21c0-a609-45de-9cb9-48782a78c4cc	José Carlos Hidalgo Guerrero	10	centrocampista	5.0	disponible	t	\N	t
88821f4a-3895-4240-aaa8-b16a0643d79d	600d21c0-a609-45de-9cb9-48782a78c4cc	José Pérez 	19	centrocampista	5.0	disponible	t	\N	f
855dee3c-88f5-48e0-9f8f-59102c621f78	600d21c0-a609-45de-9cb9-48782a78c4cc	Juan 	22	portero	5.0	disponible	t	https://res.cloudinary.com/ddad1uoef/image/upload/v1781448855/jugadores/ndzqsjzjyvoij75dzabo.png	t
5fa472f6-8623-4bc0-9f65-a7a4a684d4ab	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Antonio Galindo Gámez	1	portero	5.0	disponible	t	\N	f
6ae86b6e-a9ee-445b-bdeb-a4c95e44431b	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Sergio Vergara Ramírez	2	defensa	5.0	disponible	t	\N	f
2670915c-e5c1-4bd9-8dcb-a4e3ae0dc6b2	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Natan Ruiz Fajardo	3	centrocampista	5.0	disponible	t	\N	f
49bffd42-a280-44d9-80b7-4d3213de9bf3	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Laureano Martínez Pachón	4	defensa	5.0	disponible	t	\N	f
0f8fde5d-2eac-4d9b-9438-c5b288a9a268	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Hugo Lopez Rubio	5	delantero	5.0	disponible	t	\N	f
921206e5-964a-481c-9370-92601da1b2f9	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Hugo Salazar Marín	6	centrocampista	5.0	disponible	t	\N	f
1ae19eb5-657a-4c20-8fe3-3476c444e995	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Pablo López Rubio	7	defensa	5.0	disponible	t	\N	f
c6c2f6e8-3b4a-415a-9985-ed2793dfa398	8692b077-8cf8-45c5-bf30-6c68b3523d2c	Ángel Piqueras Cuadrado	8	centrocampista	5.0	disponible	t	\N	f
\.


--
-- Data for Name: partidos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partidos (id, jornada_id, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante, estado, hora_inicio, minuto) FROM stdin;
adc8b817-de58-49d2-8763-bf5fc3dac86a	bcd9ec9d-5f00-494d-8512-19338ab91896	336792d8-9774-452c-a3cf-619c2b5595f7	5b5db9cc-5944-4c52-a014-c5407a426604	\N	\N	upcoming	2026-06-17 18:30:00+00	\N
786deed7-afc1-4991-beac-715cff92d894	bcd9ec9d-5f00-494d-8512-19338ab91896	73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	8692b077-8cf8-45c5-bf30-6c68b3523d2c	\N	\N	upcoming	2026-06-17 19:30:00+00	\N
aa0c0388-4a5a-46f1-a747-53bcae503bbc	bcd9ec9d-5f00-494d-8512-19338ab91896	5a80f7c3-31ea-4356-97f6-e09688418b8e	9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	\N	\N	upcoming	2026-06-18 18:30:00+00	\N
629fa9d5-e950-463f-b06b-f03b935820eb	bcd9ec9d-5f00-494d-8512-19338ab91896	745cc0d1-b022-44fd-a67b-89b143337cf5	02c66461-42f2-4569-b606-f2eb23aa313a	\N	\N	upcoming	2026-06-18 19:30:00+00	\N
844ad925-71cf-4f6d-9d9c-a44f3f783232	bcd9ec9d-5f00-494d-8512-19338ab91896	1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	600d21c0-a609-45de-9cb9-48782a78c4cc	\N	\N	upcoming	2026-06-18 19:30:00+00	\N
6a1fb885-7141-4127-9595-bbe6e7e6c7df	43d9293c-4bb6-42a0-8833-0d33a2fbdefa	5a80f7c3-31ea-4356-97f6-e09688418b8e	5b5db9cc-5944-4c52-a014-c5407a426604	\N	\N	upcoming	2026-06-22 18:30:00+00	\N
15c461c4-ea7e-4087-94e6-35911b47da8f	43d9293c-4bb6-42a0-8833-0d33a2fbdefa	73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	600d21c0-a609-45de-9cb9-48782a78c4cc	\N	\N	upcoming	2026-06-23 18:30:00+00	\N
beaa9fae-e93f-4e14-b094-adbd4c0438d0	43d9293c-4bb6-42a0-8833-0d33a2fbdefa	8692b077-8cf8-45c5-bf30-6c68b3523d2c	745cc0d1-b022-44fd-a67b-89b143337cf5	\N	\N	upcoming	2026-06-22 19:30:00+00	\N
f01061cb-8c1a-4bb2-9c4c-129cb52a331c	43d9293c-4bb6-42a0-8833-0d33a2fbdefa	1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	336792d8-9774-452c-a3cf-619c2b5595f7	\N	\N	upcoming	2026-06-22 19:30:00+00	\N
e4f0a403-d2f0-4f52-af15-2b07eb147ec9	43d9293c-4bb6-42a0-8833-0d33a2fbdefa	9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	02c66461-42f2-4569-b606-f2eb23aa313a	\N	\N	upcoming	2026-06-23 19:30:00+00	\N
046bd069-b449-42dc-b445-cb9f7d96402c	8f9c6efa-80c6-4826-96a3-8666f51ebf57	5b5db9cc-5944-4c52-a014-c5407a426604	8692b077-8cf8-45c5-bf30-6c68b3523d2c	\N	\N	upcoming	2026-06-24 18:30:00+00	\N
c3aa1cf4-5074-4d60-bd23-9477f36212ff	8f9c6efa-80c6-4826-96a3-8666f51ebf57	600d21c0-a609-45de-9cb9-48782a78c4cc	9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	\N	\N	upcoming	2026-06-25 18:30:00+00	\N
0cfedbdb-8808-4569-9ead-fc87b953e8bb	8f9c6efa-80c6-4826-96a3-8666f51ebf57	745cc0d1-b022-44fd-a67b-89b143337cf5	5a80f7c3-31ea-4356-97f6-e09688418b8e	\N	\N	upcoming	2026-06-24 19:30:00+00	\N
9c0ad8cc-2e96-4674-ab29-528cb2682cae	8f9c6efa-80c6-4826-96a3-8666f51ebf57	73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	\N	\N	upcoming	2026-06-25 19:30:00+00	\N
10aa92b0-61d5-43fc-9b3d-f8b964b2f186	8f9c6efa-80c6-4826-96a3-8666f51ebf57	336792d8-9774-452c-a3cf-619c2b5595f7	02c66461-42f2-4569-b606-f2eb23aa313a	\N	\N	upcoming	2026-06-25 19:30:00+00	\N
2fcaf00f-7dfb-4729-8b5c-0cc2e6e4059a	23369f69-bcad-4f4c-a074-d3531c1eb0a0	9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	745cc0d1-b022-44fd-a67b-89b143337cf5	\N	\N	upcoming	2026-06-30 18:30:00+00	\N
6ccc0546-eb0f-4a34-bfd9-64497ef8338d	23369f69-bcad-4f4c-a074-d3531c1eb0a0	73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	336792d8-9774-452c-a3cf-619c2b5595f7	\N	\N	upcoming	2026-06-30 19:30:00+00	\N
dc47ffcf-59c5-48e8-819d-efb5e0e2be24	23369f69-bcad-4f4c-a074-d3531c1eb0a0	8692b077-8cf8-45c5-bf30-6c68b3523d2c	600d21c0-a609-45de-9cb9-48782a78c4cc	\N	\N	upcoming	2026-07-01 18:30:00+00	\N
e3f48d1c-9e43-4a34-8263-631b538913e9	23369f69-bcad-4f4c-a074-d3531c1eb0a0	5a80f7c3-31ea-4356-97f6-e09688418b8e	1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	\N	\N	upcoming	2026-07-01 19:30:00+00	\N
b2548949-c7cb-4d29-b1f7-b135ae45fc99	23369f69-bcad-4f4c-a074-d3531c1eb0a0	02c66461-42f2-4569-b606-f2eb23aa313a	5b5db9cc-5944-4c52-a014-c5407a426604	\N	\N	upcoming	2026-07-01 19:30:00+00	\N
29d44aa4-9ee9-4fee-9d61-2f085e5b3d0d	3a4d7ef7-6680-4b28-a2ca-cecb0c43d2b3	336792d8-9774-452c-a3cf-619c2b5595f7	5a80f7c3-31ea-4356-97f6-e09688418b8e	\N	\N	upcoming	2026-07-06 18:30:00+00	\N
67616e56-bf63-4a16-b4da-4bba5b7327c5	3a4d7ef7-6680-4b28-a2ca-cecb0c43d2b3	5b5db9cc-5944-4c52-a014-c5407a426604	73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	\N	\N	upcoming	2026-07-06 19:30:00+00	\N
9798d354-128b-43cc-b2de-707a7ece46fd	3a4d7ef7-6680-4b28-a2ca-cecb0c43d2b3	600d21c0-a609-45de-9cb9-48782a78c4cc	02c66461-42f2-4569-b606-f2eb23aa313a	\N	\N	upcoming	2026-07-07 18:30:00+00	\N
42dec4d3-8200-49b7-87f3-b10f083e3629	3a4d7ef7-6680-4b28-a2ca-cecb0c43d2b3	745cc0d1-b022-44fd-a67b-89b143337cf5	1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	\N	\N	upcoming	2026-07-07 19:30:00+00	\N
b1048b32-d19a-47f9-8d6b-41ba16695560	3a4d7ef7-6680-4b28-a2ca-cecb0c43d2b3	8692b077-8cf8-45c5-bf30-6c68b3523d2c	9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	\N	\N	upcoming	2026-07-07 19:30:00+00	\N
7cfa47d3-73dd-44c4-a440-022ce02d9a4e	d7a4c532-081b-4d2a-935e-19e193389a5c	73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	5a80f7c3-31ea-4356-97f6-e09688418b8e	\N	\N	upcoming	2026-07-08 18:30:00+00	\N
752aae9f-c605-4a93-86d5-5b41d9ff64ee	d7a4c532-081b-4d2a-935e-19e193389a5c	8692b077-8cf8-45c5-bf30-6c68b3523d2c	336792d8-9774-452c-a3cf-619c2b5595f7	\N	\N	upcoming	2026-07-08 19:30:00+00	\N
b680aac4-b526-4520-aaae-6d96e94facae	d7a4c532-081b-4d2a-935e-19e193389a5c	02c66461-42f2-4569-b606-f2eb23aa313a	1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	\N	\N	upcoming	2026-07-09 18:30:00+00	\N
978944fb-459b-4676-ad6a-6360ede5f905	d7a4c532-081b-4d2a-935e-19e193389a5c	9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	5b5db9cc-5944-4c52-a014-c5407a426604	\N	\N	upcoming	2026-07-09 19:30:00+00	\N
39a72888-9171-4b1c-a089-fad40342bdea	d7a4c532-081b-4d2a-935e-19e193389a5c	600d21c0-a609-45de-9cb9-48782a78c4cc	745cc0d1-b022-44fd-a67b-89b143337cf5	\N	\N	upcoming	2026-07-09 19:30:00+00	\N
15bef39b-ebf8-452d-86a2-c395953d51a9	7641a443-ecad-4e76-94c3-bd2dc08eb299	745cc0d1-b022-44fd-a67b-89b143337cf5	73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	\N	\N	upcoming	2026-07-13 18:30:00+00	\N
1e54792d-9e11-49dc-be51-329af3e7e914	7641a443-ecad-4e76-94c3-bd2dc08eb299	5a80f7c3-31ea-4356-97f6-e09688418b8e	02c66461-42f2-4569-b606-f2eb23aa313a	\N	\N	upcoming	2026-07-13 19:30:00+00	\N
3358e0b4-d221-4008-9a36-d20f45ff898f	7641a443-ecad-4e76-94c3-bd2dc08eb299	1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	8692b077-8cf8-45c5-bf30-6c68b3523d2c	\N	\N	upcoming	2026-07-16 18:30:00+00	\N
a4668741-f53d-43fc-a67e-a27f0e93dc11	7641a443-ecad-4e76-94c3-bd2dc08eb299	336792d8-9774-452c-a3cf-619c2b5595f7	9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	\N	\N	upcoming	2026-07-16 19:30:00+00	\N
60972f65-408e-4438-b3f5-d6e399ddcf7c	7641a443-ecad-4e76-94c3-bd2dc08eb299	5b5db9cc-5944-4c52-a014-c5407a426604	600d21c0-a609-45de-9cb9-48782a78c4cc	\N	\N	upcoming	2026-07-16 19:30:00+00	\N
2479544d-0f9c-470a-a423-00269b816a3f	caeeba6b-b447-4d0a-9a5d-728fd89e6765	8692b077-8cf8-45c5-bf30-6c68b3523d2c	5a80f7c3-31ea-4356-97f6-e09688418b8e	\N	\N	upcoming	2026-07-20 18:30:00+00	\N
be11b251-2d75-4da8-aa5a-263dfa21c1fb	caeeba6b-b447-4d0a-9a5d-728fd89e6765	02c66461-42f2-4569-b606-f2eb23aa313a	73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	\N	\N	upcoming	2026-07-20 19:30:00+00	\N
d9307ff3-9ecd-4ad7-91ee-f00ba3935007	caeeba6b-b447-4d0a-9a5d-728fd89e6765	9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	\N	\N	upcoming	2026-07-20 19:30:00+00	\N
c4b77749-7bbd-4ed7-8b27-568166d6be7f	caeeba6b-b447-4d0a-9a5d-728fd89e6765	600d21c0-a609-45de-9cb9-48782a78c4cc	336792d8-9774-452c-a3cf-619c2b5595f7	\N	\N	upcoming	2026-07-21 18:30:00+00	\N
f712a299-6123-4bfa-a9ce-61c902c55952	caeeba6b-b447-4d0a-9a5d-728fd89e6765	5b5db9cc-5944-4c52-a014-c5407a426604	745cc0d1-b022-44fd-a67b-89b143337cf5	\N	\N	upcoming	2026-07-21 19:30:00+00	\N
5d815f37-b7a5-4ed6-b8fa-c94b698df03c	4e5e42c1-3cf4-46ae-8da4-61d6b5961baa	73b0c8a6-bd20-4fed-bd6f-9dd87e60a659	9bf4a5cf-cde3-46ff-aefd-3670b9dc3918	\N	\N	upcoming	2026-07-22 18:30:00+00	\N
0a215fc6-9c5c-4a4a-b417-ed9f2023f7ab	4e5e42c1-3cf4-46ae-8da4-61d6b5961baa	02c66461-42f2-4569-b606-f2eb23aa313a	8692b077-8cf8-45c5-bf30-6c68b3523d2c	\N	\N	upcoming	2026-07-22 19:30:00+00	\N
494bbdeb-1e88-4487-92a8-22ed31d19c4a	4e5e42c1-3cf4-46ae-8da4-61d6b5961baa	5b5db9cc-5944-4c52-a014-c5407a426604	1b8e3b4e-a4a3-42f6-bf0f-1b766baaa98a	\N	\N	upcoming	2026-07-23 18:30:00+00	\N
284b96c8-54e0-4486-80de-8b81ab18bb83	4e5e42c1-3cf4-46ae-8da4-61d6b5961baa	600d21c0-a609-45de-9cb9-48782a78c4cc	5a80f7c3-31ea-4356-97f6-e09688418b8e	\N	\N	upcoming	2026-07-23 19:30:00+00	\N
55469448-dc80-4078-b7e3-d36c6b10833e	4e5e42c1-3cf4-46ae-8da4-61d6b5961baa	745cc0d1-b022-44fd-a67b-89b143337cf5	336792d8-9774-452c-a3cf-619c2b5595f7	\N	\N	upcoming	2026-07-23 19:30:00+00	\N
\.


--
-- Data for Name: estadisticas_jugador; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estadisticas_jugador (id, jugador_id, partido_id, goles, asistencias, tarjeta_amarilla, tarjeta_roja, minutos_jugados, portero_sin_goles, puntos_fantasy) FROM stdin;
\.


--
-- Data for Name: ligas_fantasy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ligas_fantasy (id, nombre, codigo_invitacion, creador_id, jornada_inicio, created_at) FROM stdin;
f262214b-adfc-4bb7-899a-26b792e7f454	Prueba	6C1498	5a85412f-957f-4c6f-a983-d17021d8bea7	2	2026-06-08 16:19:53.121344+00
2c9c9294-f90b-4acc-bafc-88b4670d26e2	Prueba	456BEB	5a85412f-957f-4c6f-a983-d17021d8bea7	2	2026-06-08 17:03:59.917613+00
\.


--
-- Data for Name: miembros_liga_fantasy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.miembros_liga_fantasy (id, liga_id, usuario_id, nombre_equipo, presupuesto, puntos_total, joined_at) FROM stdin;
5b07d8e7-65e3-4cb8-be3b-99431eaef317	2c9c9294-f90b-4acc-bafc-88b4670d26e2	e26f560b-3397-4b91-acbe-e7985cb10712	paco	69.5	0	2026-06-09 10:17:34.637927+00
5176b528-78cc-48e0-8d40-0c28b82ce895	2c9c9294-f90b-4acc-bafc-88b4670d26e2	5a85412f-957f-4c6f-a983-d17021d8bea7	P{rueba	65.0	0	2026-06-09 10:04:14.239001+00
da0458e2-93ad-4123-a65a-57897b6f73c3	2c9c9294-f90b-4acc-bafc-88b4670d26e2	5bcd7efe-f522-42df-8135-64ce09faacd4	CF LOS ITV	100.0	0	2026-06-14 12:47:47.135184+00
\.


--
-- Data for Name: plantilla_fantasy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plantilla_fantasy (id, miembro_id, jugador_id, es_titular, es_capitan, precio_compra, fichado_at) FROM stdin;
\.


--
-- Data for Name: puntuaciones_fantasy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.puntuaciones_fantasy (id, miembro_id, jornada_numero, puntos, calculado_at) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

\unrestrict DBd3I5gqBO4dy13ag6lBgDukocEbAypJmwcENqPWyy5wtIz5VZ1GmcWEuhf9PZZ

