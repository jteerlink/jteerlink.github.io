---
layout: page
title: Projects
permalink: /posts/
---

<div class="posts-list">
  {% for post in site.posts %}
    <article class="post-item">
      {% if post.image %}
        <div class="post-item__image">
          <a href="{{ site.baseurl }}{{ post.url }}">
            <div class="post-image" style="background-image: url({{ site.baseurl }}/images/{{ post.image }})"></div>
          </a>
        </div>
      {% endif %}
      
      <div class="post-item__content">
        <h2 class="post-item__title">
          <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a>
        </h2>
        
        <div class="post-item__meta">
          <time datetime="{{ post.date | date_to_xmlschema }}">
            {{ post.date | date: "%B %d, %Y" }}
          </time>
        </div>
        
        <div class="post-item__excerpt">
          {% if post.description %}
            {{ post.description }}
          {% else %}
            {{ post.content | strip_html | truncate: 150 }}
          {% endif %}
        </div>
      </div>
    </article>
  {% endfor %}
</div>